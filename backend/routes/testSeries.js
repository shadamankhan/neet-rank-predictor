const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Test = require('../src/models/Test');
const Question = require('../src/models/Question');
const User = require('../src/models/User'); // Assuming User model exists
const mongoose = require('mongoose');

// GET all tests
router.post('/migrate-legacy', async (req, res) => {
    console.log("👉 MIGRATION ROUTE HIT!");
    try {
        let testsToRestore = [];

        if (req.body.tests && Array.isArray(req.body.tests)) {
            testsToRestore = req.body.tests;
            console.log("Using provided request body for migration");
        } else {
            const LEGACY_DB_PATH = path.join(__dirname, '../data/test_series_db.json');
            if (fs.existsSync(LEGACY_DB_PATH)) {
                const data = JSON.parse(fs.readFileSync(LEGACY_DB_PATH, 'utf8'));
                testsToRestore = data.tests || [];
            } else {
                return res.status(404).json({ ok: false, message: 'Legacy DB file not found and no body provided' });
            }
        }
        let restoredCount = 0;

        for (const testData of testsToRestore) {
            const existing = await Test.findOne({ title: testData.title });
            if (existing) continue;

            const finalQuestionIds = [];
            if (testData.questions) {
                for (const q of testData.questions) {
                    const newQ = new Question({
                        statement: q.question,
                        type: 'mcq',
                        options: q.options.map((optText, idx) => ({ id: idx + 1, text: optText, isCorrect: parseInt(q.answer) === idx })),
                        explanation: q.explanation,
                        tags: { subject: q.subject || 'General' }
                    });
                    const savedQ = await newQ.save();
                    finalQuestionIds.push(savedQ._id);
                }
            }

            const newTest = new Test({
                title: testData.title,
                type: testData.type || 'free',
                duration: parseInt(testData.duration) || 180,
                totalMarks: parseInt(testData.totalMarks) || 720,
                instructions: testData.instructions,
                questionIds: finalQuestionIds,
                schedule: { startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) },
                status: 'live',
                contentSource: 'question_bank'
            });

            await newTest.save();
            restoredCount++;
        }
        res.json({ ok: true, message: `Restored ${restoredCount} tests.` });
    } catch (e) {
        console.error("Migration error:", e);
        res.status(500).json({ ok: false, message: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });
        res.json({ ok: true, tests });
    } catch (err) {
        console.error("❌ GET /api/test-series FAILED:", err);
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
            'pyq': 'pyq',
            'free': 'free',
            'generated': 'full'
        };

        // Helper for safe date formatting
        const safeDate = (d) => {
            try {
                if (!d) return 'TBA';
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return 'TBA'; // Invalid Date check
                return dateObj.toLocaleDateString();
            } catch (e) {
                return 'TBA';
            }
        };

        tests.forEach(t => {
            try {
                const catId = typeMap[t.type] || t.type || 'free';
                if (!testBundles[catId]) testBundles[catId] = [];

                testBundles[catId].push({
                    id: t._id,
                    title: t.title,
                    questions: t.totalQuestions,
                    time: t.duration,
                    price: t.price > 0 ? t.price : 'Free',
                    status: t.status === 'live' ? 'Open' : 'Locked',
                    isPremium: t.isPremium,
                    date: safeDate(t.schedule?.startDate)
                });
            } catch (innerErr) {
                console.warn(`⚠️ Skipped malformed test ${t._id}:`, innerErr.message);
            }
        });

        // Find upcoming test (safe wrapper)
        let upcomingTest = null;
        try {
            const upcoming = await Test.findOne({
                'schedule.startDate': { $gt: new Date() }
            }).sort({ 'schedule.startDate': 1 });

            if (upcoming && upcoming.schedule && upcoming.schedule.startDate) {
                upcomingTest = {
                    id: upcoming._id,
                    title: upcoming.title || 'Upcoming Test',
                    date: safeDate(upcoming.schedule.startDate),
                    timeLeft: 'Coming Soon',
                    topics: upcoming.subjects?.join(', ') || 'General',
                    participants: 1200
                };
            }
        } catch (upcomingErr) {
            console.error("Error fetching upcoming test:", upcomingErr);
            // safe to ignore, just no upcoming section
        }

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
// CREATE new test
router.post('/', async (req, res) => {
    try {
        const { title, type, duration, totalMarks, instructions, questions = [], startDate, endDate, price, isPremium, status } = req.body;

        // Process questions (Strings are IDs, Objects are new questions)
        const finalQuestionIds = [];

        for (const q of questions) {
            if (typeof q === 'string') {
                // It's an existing ID from Question Bank
                if (mongoose.Types.ObjectId.isValid(q)) {
                    finalQuestionIds.push(q);
                }
            } else if (typeof q === 'object' && q.question) {
                // It's a new Manual Question - Save it first!
                try {
                    const newQ = new Question({
                        statement: q.question,
                        type: 'mcq',
                        options: q.options.map((optText, idx) => ({
                            id: idx + 1,
                            text: optText,
                            isCorrect: parseInt(q.answer) === idx
                        })),
                        explanation: q.explanation,
                        tags: {
                            subject: q.subject,
                            difficulty: 'medium', // Default
                            source: 'Manual Entry'
                        }
                    });
                    const savedQ = await newQ.save();
                    finalQuestionIds.push(savedQ._id);
                    console.log(`✅ Auto-created question: ${savedQ._id}`);
                } catch (qErr) {
                    console.error("Failed to save manual question:", qErr);
                    // Continue without this question or fail? 
                    // Better to continue to verify rest of validation
                }
            }
        }

        const newTest = new Test({
            title,
            type,
            duration: parseInt(duration) || 180,
            totalMarks: parseInt(totalMarks) || 720,
            instructions,
            questionIds: finalQuestionIds, // mapped IDs
            schedule: {
                startDate: startDate || new Date(),
                endDate: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            },
            price: price || 0,
            isPremium: isPremium || false,
            status: (status || 'draft').toLowerCase(),
            contentSource: 'question_bank'
        });

        await newTest.save();
        res.json({ ok: true, message: 'Test created successfully', testId: newTest._id });
    } catch (err) {
        console.error('Create test error:', err);
        res.status(500).json({ ok: false, message: 'Internal server error: ' + err.message });
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
        if (status) updateData.status = status.toLowerCase();

        const updated = await Test.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ ok: false, message: 'Test not found' });

        res.json({ ok: true, message: 'Test updated successfully' });
    } catch (err) {
        res.status(500).json({ ok: false, message: 'Failed to update test' });
    }
});

module.exports = router;
