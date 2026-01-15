const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('../../firebaseAdmin');
const admin = firebaseAdmin.admin;
const Attempt = require('../models/Attempt');

const DATA_FILE = path.join(__dirname, '../../data/user_mock_tests.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Middleware to verify user
async function verifyUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
}

// GET /api/user/mock-tests
router.get('/mock-tests', verifyUser, async (req, res) => {
    try {
        const allTests = readData();
        const manualTests = allTests.filter(t => t.uid === req.user.uid);

        // Fetch actual test attempts from MongoDB
        const attempts = await Attempt.find({ userId: req.user.uid }).populate('testId');

        const dbTests = attempts.map(a => ({
            id: a._id, // Use _id as unique ID
            uid: a.userId,
            testName: a.testId ? a.testId.title : 'Unknown Test',
            score: a.score,
            totalMarks: a.testId ? a.testId.totalMarks : 720,
            date: a.submitTime || a.createdAt,
            testId: a.testId ? a.testId._id : null,
            predictedRank: a.rank, // If we saved rank
            isRealAttempt: true
        }));

        const combinedTests = [...manualTests, ...dbTests];

        // Sort by date desc
        combinedTests.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ ok: true, tests: combinedTests });
    } catch (err) {
        console.error("Failed to fetch mock tests:", err);
        res.status(500).json({ ok: false, message: "Failed to load tests" });
    }
});

// POST /api/user/mock-tests
router.post('/mock-tests', verifyUser, (req, res) => {
    const { testName, score, totalMarks, date } = req.body;

    if (!testName || !score) {
        return res.status(400).json({ ok: false, message: 'Missing fields' });
    }

    const newTest = {
        id: uuidv4(),
        uid: req.user.uid,
        testName,
        score: Number(score),
        totalMarks: Number(totalMarks) || 720,
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    const allTests = readData();
    allTests.push(newTest);
    writeData(allTests);

    res.json({ ok: true, test: newTest });
});

// DELETE /api/user/mock-tests/:id
router.delete('/mock-tests/:id', verifyUser, async (req, res) => {
    const { id } = req.params;
    let allTests = readData();

    // 1. Try deleting from Manual JSON File
    const testIndex = allTests.findIndex(t => t.id === id && t.uid === req.user.uid);
    if (testIndex !== -1) {
        allTests.splice(testIndex, 1);
        writeData(allTests);
        return res.json({ ok: true, id, source: 'manual' });
    }

    // 2. If not found in JSON, try deleting from MongoDB (Real Attempts)
    try {
        const deletedAttempt = await Attempt.findOneAndDelete({ _id: id, userId: req.user.uid });

        if (deletedAttempt) {
            return res.json({ ok: true, id, source: 'database' });
        } else {
            return res.status(404).json({ ok: false, message: 'Test attempt not found or unauthorized' });
        }
    } catch (err) {
        console.error("Delete attempt error:", err);
        return res.status(500).json({ ok: false, message: 'Server error during deletion' });
    }
});

module.exports = router;
