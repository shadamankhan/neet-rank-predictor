const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const QUERIES_FILE = path.join(__dirname, '../data/user_queries.json');
const MOCK_TESTS_FILE = path.join(__dirname, '../data/user_mock_tests.json');

// Helper to read JSON safely
const readJSON = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return [];
    }
};

// GET /api/students -  Aggregate student list
router.get('/', (req, res) => {
    try {
        const queries = readJSON(QUERIES_FILE);
        const tests = readJSON(MOCK_TESTS_FILE);

        const students = {};

        // 1. Extract users from Queries (Source of Name/Email/Phone)
        queries.forEach(q => {
            if (!q.uid) return;
            if (!students[q.uid]) {
                students[q.uid] = {
                    uid: q.uid,
                    name: q.name || 'Unknown',
                    email: q.email || 'N/A',
                    phone: q.phone || 'N/A',
                    joinedAt: q.createdAt,
                    testsTaken: 0,
                    avgScore: 0,
                    lastActive: q.createdAt
                };
            } else {
                // Update with better info if available
                if (q.name && students[q.uid].name === 'Unknown') students[q.uid].name = q.name;
                if (q.email && students[q.uid].email === 'N/A') students[q.uid].email = q.email;
                if (q.phone && students[q.uid].phone === 'N/A') students[q.uid].phone = q.phone;
                // Update last active
                if (new Date(q.createdAt) > new Date(students[q.uid].lastActive)) {
                    students[q.uid].lastActive = q.createdAt;
                }
            }
        });

        // 2. Extract/Update from Mock Tests (Source of Performance)
        tests.forEach(t => {
            if (!t.uid) return;
            // If user not in queries, create basic entry
            if (!students[t.uid]) {
                students[t.uid] = {
                    uid: t.uid,
                    name: 'Student (No Query)', // Placeholder
                    email: 'N/A',
                    phone: 'N/A',
                    joinedAt: t.createdAt,
                    testsTaken: 0,
                    avgScore: 0,
                    totalScore: 0, // Temp for calc
                    lastActive: t.createdAt
                };
            }

            const s = students[t.uid];
            s.testsTaken++;
            s.totalScore = (s.totalScore || 0) + (parseInt(t.score) || 0);

            // Update last active
            if (new Date(t.createdAt) > new Date(s.lastActive)) {
                s.lastActive = t.createdAt;
            }
        });

        // 3. Finalize Stats
        const studentList = Object.values(students).map(s => {
            if (s.testsTaken > 0) {
                s.avgScore = Math.round(s.totalScore / s.testsTaken);
            }
            delete s.totalScore; // Cleanup
            return s;
        });

        // Sort by last active desc
        studentList.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

        res.json({ ok: true, students: studentList });
    } catch (err) {
        console.error("Get students error:", err);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
});

// GET /api/students/:uid - Get single student detail
router.get('/:uid', (req, res) => {
    try {
        const { uid } = req.params;
        const queries = readJSON(QUERIES_FILE);
        const tests = readJSON(MOCK_TESTS_FILE);

        const studentQueries = queries.filter(q => q.uid === uid);
        const studentTests = tests.filter(t => t.uid === uid);

        if (studentQueries.length === 0 && studentTests.length === 0) {
            return res.status(404).json({ ok: false, message: 'Student not found' });
        }

        // Basic Info from first available query or generic
        let profile = {
            uid,
            name: 'Unknown',
            email: 'N/A',
            phone: 'N/A',
            joinedAt: ''
        };

        if (studentQueries.length > 0) {
            const q = studentQueries[0];
            profile.name = q.name || profile.name;
            profile.email = q.email || profile.email;
            profile.phone = q.phone || profile.phone;
            profile.joinedAt = q.createdAt;
        } else if (studentTests.length > 0) {
            profile.joinedAt = studentTests[0].createdAt;
        }

        // Calculate Stats
        const stats = {
            testsTaken: studentTests.length,
            avgScore: 0,
            highestScore: 0,
            queriesAsked: studentQueries.length
        };

        let totalScore = 0;
        studentTests.forEach(t => {
            const score = parseInt(t.score) || 0;
            totalScore += score;
            if (score > stats.highestScore) stats.highestScore = score;
        });
        if (stats.testsTaken > 0) stats.avgScore = Math.round(totalScore / stats.testsTaken);

        res.json({
            ok: true,
            profile,
            stats,
            history: {
                tests: studentTests.sort((a, b) => new Date(b.date) - new Date(a.date)),
                queries: studentQueries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            }
        });

    } catch (err) {
        console.error("Get student detail error:", err);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
