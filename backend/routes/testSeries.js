const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
// Removed uuid to fix version/import issues
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const TESTS_FILE = path.join(__dirname, '../data/test_series_db.json');

// Ensure DB file exists
if (!fs.existsSync(TESTS_FILE)) {
    fs.writeFileSync(TESTS_FILE, JSON.stringify({ tests: [], questions: [] }, null, 2));
}

// Helper to read DB
const readDB = () => {
    try {
        const data = fs.readFileSync(TESTS_FILE, 'utf8');
        const db = JSON.parse(data);
        if (!db.tests) db.tests = [];
        return db;
    } catch (err) {
        // Only return empty if file doesn't exist.
        // If file exists but is locked or corrupt, THROW error to prevent overwrite.
        if (err.code === 'ENOENT') {
            return { tests: [], questions: [] };
        }
        console.error(`CRITICAL: Failed to read DB ${TESTS_FILE}. Error:`, err.message);
        throw err; // Stop execution to protect data
    }
};

// Helper to write DB (Atomic Write)
const writeDB = (data) => {
    const tempFile = `${TESTS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, TESTS_FILE);
};

// GET all tests
router.get('/', (req, res) => {
    const db = readDB();
    res.json({ ok: true, tests: db.tests });
});

// GET Dashboard Data
router.get('/dashboard', (req, res) => {
    try {
        const db = readDB();

        // Transform series into the format expected by frontend properties: testBundles[categoryId]
        const testBundles = {};
        if (db.series) {
            db.series.forEach(s => {
                if (!testBundles[s.categoryId]) testBundles[s.categoryId] = [];
                // Flatten the series tests or just add them? 
                // Frontend iterates testBundles[activeTab] which is an array of tests.
                // In DB series has "tests" array. 
                // Let's assume we concat them.
                if (s.tests) testBundles[s.categoryId] = [...testBundles[s.categoryId], ...s.tests];
            });
        }

        // Also add individual "tests" created via admin to their respective categories (mapped by type maybe?)
        // Admin tests have 'type' field: 'mock', 'chapter', 'previous_year'
        // Categories IDs: 'free', 'chapter', 'part', 'full', 'pyq'
        // We'll map admin types to category IDs
        const typeMap = {
            'mock': 'full',
            'chapter': 'chapter',
            'part': 'part',
            'pyq': 'pyq',
            'free': 'free'
        };

        if (db.tests) {
            db.tests.forEach(t => {
                // Determine Category
                const catId = typeMap[t.type] || 'free';
                if (!testBundles[catId]) testBundles[catId] = [];

                // Filter: Only show Live tests
                if (t.status === 'Live') {
                    testBundles[catId].push({
                        id: t.id,
                        title: t.title,
                        questions: t.questions?.length || 0,
                        time: t.duration,
                        price: t.price || 'Free',
                        status: t.status || 'Live',
                        isPremium: t.isPremium || false,
                        date: t.startDate
                    });
                }
            });
        }

        res.json({
            upcomingTest: db.upcomingTest,
            categories: db.categories || [],
            testBundles: testBundles
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ ok: false, message: "Failed to load dashboard data" });
    }
});

// CREATE new test
// CREATE new test
router.post('/', (req, res) => {
    try {
        const { title, type, duration, totalMarks, instructions, questions, startDate, endDate, price, isPremium, status } = req.body;

        if (!title || !type) {
            return res.status(400).json({ ok: false, message: 'Missing required fields' });
        }

        const db = readDB();
        const newTest = {
            id: generateId(),
            title,
            type,
            duration: parseInt(duration) || 180,
            totalMarks: parseInt(totalMarks) || 720,
            instructions: instructions || '',
            questions: questions || [], // Array of question IDs
            startDate: startDate || null,
            endDate: endDate || null,
            price: price || 0,
            isPremium: isPremium || false,
            status: status || 'draft',
            createdAt: new Date().toISOString()
        };

        db.tests.push(newTest);
        writeDB(db);

        res.json({ ok: true, message: 'Test created successfully', testId: newTest.id });
    } catch (err) {
        console.error('Create test error:', err);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});
// GET single test
router.get('/:id', (req, res) => {
    const db = readDB();
    const test = db.tests.find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ ok: false, message: 'Test not found' });
    res.json({ ok: true, test });
});

// POST /submit - Submit Test & Calculate Result
router.post('/submit', (req, res) => {
    try {
        const { testId, uid, responses, timeTaken } = req.body;
        // responses: { "Physics": { "0": { selectedOption: 1, status: 'answered' } } }

        const db = readDB();
        const test = db.tests.find(t => t.id === testId);
        if (!test) return res.status(404).json({ ok: false, message: 'Test not found' });

        let totalScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let attemptedCount = 0;

        const subjectWise = {};

        // Calculate Score
        // Assume frontend sends flat answers map: { questionIndex: selectedOption }
        const answers = req.body.answers || {};

        test.questions.forEach((q, idx) => {
            const subject = q.subject || 'General';
            if (!subjectWise[subject]) subjectWise[subject] = { score: 0, total: 0, correct: 0, wrong: 0, attempted: 0, totalQs: 0 };

            subjectWise[subject].totalQs++;
            subjectWise[subject].total += 4;

            const userOpt = answers[idx]; // 0, 1, 2, 3

            if (userOpt !== undefined && userOpt !== null) {
                attemptedCount++;
                subjectWise[subject].attempted++;

                if (parseInt(userOpt) === parseInt(q.answer)) {
                    totalScore += 4;
                    correctCount++;
                    subjectWise[subject].score += 4;
                    subjectWise[subject].correct++;
                } else {
                    totalScore -= 1;
                    incorrectCount++;
                    subjectWise[subject].score -= 1;
                    subjectWise[subject].wrong++;
                }
            }
        });

        // Save Result
        const MOCK_TESTS_FILE = path.join(__dirname, '../data/user_mock_tests.json');
        let userTests = [];
        if (fs.existsSync(MOCK_TESTS_FILE)) {
            try { userTests = JSON.parse(fs.readFileSync(MOCK_TESTS_FILE, 'utf8')); } catch (e) { }
        }

        const resultId = generateId();
        const resultRecord = {
            id: resultId,
            testId,
            uid,
            testName: test.title,
            score: totalScore,
            totalMarks: test.totalMarks,
            correct: correctCount,
            incorrect: incorrectCount,
            attempted: attemptedCount,
            accuracy: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0,
            subjectWise,
            answers: answers, // Save the detailed user responses
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        userTests.push(resultRecord);
        fs.writeFileSync(MOCK_TESTS_FILE, JSON.stringify(userTests, null, 2));

        res.json({ ok: true, resultId, score: totalScore });

    } catch (err) {
        console.error("Submit error:", err);
        res.status(500).json({ ok: false, message: 'Submission failed' });
    }
});

// GET Result
router.get('/result/:resultId', (req, res) => {
    try {
        const MOCK_TESTS_FILE = path.join(__dirname, '../data/user_mock_tests.json');
        if (!fs.existsSync(MOCK_TESTS_FILE)) return res.status(404).json({ ok: false });

        const userTests = JSON.parse(fs.readFileSync(MOCK_TESTS_FILE, 'utf8'));
        const result = userTests.find(r => r.id === req.params.resultId);

        if (!result) return res.status(404).json({ ok: false });
        res.json({ ok: true, result });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

// GET all results for a specific test (Leaderboard)
router.get('/test/:testId/results', (req, res) => {
    try {
        const MOCK_TESTS_FILE = path.join(__dirname, '../data/user_mock_tests.json');
        if (!fs.existsSync(MOCK_TESTS_FILE)) return res.json({ ok: true, results: [] });

        const userTests = JSON.parse(fs.readFileSync(MOCK_TESTS_FILE, 'utf8'));

        // Filter by testId
        const testResults = userTests.filter(r => r.testId === req.params.testId);

        // Sort by score desc (Leaderboard)
        testResults.sort((a, b) => b.score - a.score);

        res.json({ ok: true, results: testResults });

    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ ok: false, message: 'Failed to load results' });
    }
});

// DELETE test
router.delete('/:id', (req, res) => {
    try {
        const db = readDB();
        const initialLength = db.tests.length;
        db.tests = db.tests.filter(t => t.id !== req.params.id);

        if (db.tests.length === initialLength) {
            return res.status(404).json({ ok: false, message: 'Test not found' });
        }

        writeDB(db);
        res.json({ ok: true, message: 'Test deleted successfully' });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ ok: false, message: 'Failed to delete test' });
    }
});

// PUT update test
router.put('/:id', (req, res) => {
    try {
        const { title, type, duration, totalMarks, instructions, questions, startDate, endDate, price, isPremium, status } = req.body;
        const db = readDB();
        const index = db.tests.findIndex(t => t.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ ok: false, message: 'Test not found' });
        }

        // Update fields
        const test = db.tests[index];
        if (title) test.title = title;
        if (type) test.type = type;
        if (duration) test.duration = parseInt(duration);
        if (totalMarks) test.totalMarks = parseInt(totalMarks);
        if (instructions) test.instructions = instructions;
        if (questions) test.questions = questions;
        if (startDate) test.startDate = startDate;
        if (endDate) test.endDate = endDate;
        if (price !== undefined) test.price = price;
        if (isPremium !== undefined) test.isPremium = isPremium;
        if (status) test.status = status;

        test.updatedAt = new Date().toISOString();

        db.tests[index] = test;
        writeDB(db);

        res.json({ ok: true, message: 'Test updated successfully' });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ ok: false, message: 'Failed to update test' });
    }
});

module.exports = router;
