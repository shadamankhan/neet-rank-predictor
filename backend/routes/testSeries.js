const express = require('express');
const router = express.Router();
const Test = require('../src/models/Test');
const Question = require('../src/models/Question');
const User = require('../src/models/User'); // Assuming User model exists
const mongoose = require('mongoose');

// GET all tests
router.get('/', async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });
        res.json({ ok: true, tests });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// GET Dashboard Data
router.get('/dashboard', async (req, res) => {
    try {
        const tests = await Test.find({ status: { $in: ['live', 'scheduled'] } });

        // Group by category
        const testBundles = {
            free: [],
            chapter: [],
            part: [],
            full: [],
            pyq: []
        };

        const typeMap = {
            'mock': 'full',
            'chapter': 'chapter',
            'part': 'part',
            'pyq': 'pyq',
            'free': 'free'
        };

        tests.forEach(t => {
            const catId = typeMap[t.type] || t.type || 'free';
            if (!testBundles[catId]) testBundles[catId] = [];

            testBundles[catId].push({
                id: t._id,
                title: t.title,
                questions: t.totalQuestions,
                time: t.duration,
                price: t.price > 0 ? t.price : 'Free',
                status: t.status === 'live' ? 'Open' : 'Locked', // Map backend status to UI
                isPremium: t.isPremium,
                date: t.schedule?.startDate ? new Date(t.schedule.startDate).toLocaleDateString() : 'TBA'
            });
        });

        // Find upcoming test (nearest future start date)
        const upcoming = await Test.findOne({
            'schedule.startDate': { $gt: new Date() }
        }).sort({ 'schedule.startDate': 1 });

        const upcomingTest = upcoming ? {
            id: upcoming._id,
            title: upcoming.title,
            date: new Date(upcoming.schedule.startDate).toLocaleDateString(),
            timeLeft: 'Coming Soon', // helper needed for real diff
            topics: upcoming.subjects?.join(', ') || 'General',
            participants: 1200 // Mock or fetch count
        } : null;

        const categories = [
            { id: "free", name: "🟢 Free Tests", desc: "NCERT Line-based & PYQs" },
            { id: "chapter", name: "🔵 Chapter Tests", desc: "Class 11 & 12 Topic-wise" },
            { id: "part", name: "🟣 Part Syllabus", desc: "Unit-wise & Half Syllabus" },
            { id: "full", name: "🔴 Full Mocks", desc: "Real Exam Pattern & AIR" },
            { id: "pyq", name: "🟠 PYQ + Trend", desc: "Last 20 Years + New Pattern" }
        ];

        res.json({
            upcomingTest,
            categories,
            testBundles
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ ok: false, message: "Failed to load dashboard data" });
    }
});

// CREATE new test
// CREATE new test (Admin)
router.post('/', async (req, res) => {
    try {
        const { title, type, duration, totalMarks, instructions, questions = [], startDate, endDate, price, isPremium, status } = req.body;

        const newTest = new Test({
            title,
            type,
            duration: parseInt(duration) || 180,
            totalMarks: parseInt(totalMarks) || 720,
            instructions,
            questionIds: questions, // direct IDs
            schedule: {
                startDate: startDate || new Date(),
                endDate: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            },
            price: price || 0,
            isPremium: isPremium || false,
            status: status || 'draft',
            contentSource: 'question_bank'
        });

        await newTest.save();
        res.json({ ok: true, message: 'Test created successfully', testId: newTest._id });
    } catch (err) {
        console.error('Create test error:', err);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});
// GET single test
router.get('/:id', async (req, res) => {
    try {
        const test = await Test.findById(req.params.id).populate('questionIds');
        if (!test) return res.status(404).json({ ok: false, message: 'Test not found' });

        // Transform for frontend consumption if needed
        const formattedTest = test.toObject();
        formattedTest.questions = formattedTest.questionIds; // Frontend expects "questions"

        res.json({ ok: true, test: formattedTest });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// POST /submit - Submit Test & Calculate Result
router.post('/submit', async (req, res) => {
    try {
        const { testId, uid, answers = {} } = req.body;
        // answers: { questionIdx: selectedOption }

        const test = await Test.findById(testId).populate('questionIds');
        if (!test) return res.status(404).json({ ok: false, message: 'Test not found' });

        let totalScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let attemptedCount = 0;
        const subjectWise = {};

        test.questionIds.forEach((q, idx) => {
            // Safe checks
            if (!q) return;

            const subject = q.tags?.subject || 'General';
            if (!subjectWise[subject]) subjectWise[subject] = { score: 0, total: 0, correct: 0, wrong: 0, attempted: 0, totalQs: 0 };

            subjectWise[subject].totalQs++;
            subjectWise[subject].total += 4;

            const userOpt = answers[idx];
            if (userOpt !== undefined && userOpt !== null) {
                attemptedCount++;
                subjectWise[subject].attempted++;

                // Q.options should have isCorrect
                const correctOption = q.options.find(o => o.isCorrect);
                const correctIdx = correctOption ? correctOption.id : -1;

                if (parseInt(userOpt) === correctIdx) {
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

        // Save Result (Using Mongoose Attempt Model or just JSON for now)
        // Since we are migrating, let's use a simple Schema or just return stats
        // To keep it simple for now as User Tests logic might be separate

        // TODO: Save to Attempt collection

        res.json({ ok: true, resultId: 'temp-id', score: totalScore });

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
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Test.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ ok: false, message: 'Test not found' });
        res.json({ ok: true, message: 'Test deleted successfully' });
    } catch (err) {
        res.status(500).json({ ok: false, message: 'Failed to delete test' });
    }
});

// PUT update test
router.put('/:id', async (req, res) => {
    try {
        const { title, type, duration, totalMarks, instructions, questions, startDate, endDate, price, isPremium, status } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (type) updateData.type = type;
        if (duration) updateData.duration = parseInt(duration);
        if (totalMarks) updateData.totalMarks = parseInt(totalMarks);
        if (instructions) updateData.instructions = instructions;
        if (questions) updateData.questionIds = questions;
        if (startDate) updateData.schedule = { ...updateData.schedule, startDate };
        if (endDate) updateData.schedule = { ...updateData.schedule, endDate };
        if (price !== undefined) updateData.price = price;
        if (isPremium !== undefined) updateData.isPremium = isPremium;
        if (status) updateData.status = status;

        const updated = await Test.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ ok: false, message: 'Test not found' });

        res.json({ ok: true, message: 'Test updated successfully' });
    } catch (err) {
        res.status(500).json({ ok: false, message: 'Failed to update test' });
    }
});

module.exports = router;
