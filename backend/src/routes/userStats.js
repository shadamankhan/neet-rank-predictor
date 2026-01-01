const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('../../firebaseAdmin');
const admin = firebaseAdmin.admin;

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
router.get('/mock-tests', verifyUser, (req, res) => {
    const allTests = readData();
    const userTests = allTests.filter(t => t.uid === req.user.uid);
    // Sort by date desc
    userTests.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ ok: true, tests: userTests });
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
router.delete('/mock-tests/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    let allTests = readData();

    const testIndex = allTests.findIndex(t => t.id === id && t.uid === req.user.uid);
    if (testIndex === -1) {
        return res.status(404).json({ ok: false, message: 'Test not found or unauthorized' });
    }

    allTests.splice(testIndex, 1);
    writeData(allTests);

    res.json({ ok: true, id });
});

module.exports = router;
