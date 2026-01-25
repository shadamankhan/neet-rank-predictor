const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Attempt = require('../src/models/Attempt');
// const Test = require('../src/models/Test');
const firebaseAdminWrapper = require('../firebaseAdmin');

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
router.get('/', async (req, res) => {
    try {
        const queries = readJSON(QUERIES_FILE);
        const legacyTests = readJSON(MOCK_TESTS_FILE);
        const students = {};

        // 0. Fetch Firebase Users (Base Source)
        if (firebaseAdminWrapper.isInitialized && firebaseAdminWrapper.admin) {
             try {
                // List batch of users, 1000 max. For production with >1000, pagination is needed.
                const listUsersResult = await firebaseAdminWrapper.admin.auth().listUsers(1000);
                listUsersResult.users.forEach((userRecord) => {
                    const uid = userRecord.uid;
                    students[uid] = {
                        uid: uid,
                        name: userRecord.displayName || 'Firebase User',
                        email: userRecord.email || 'N/A',
                        phone: userRecord.phoneNumber || 'N/A',
                        joinedAt: userRecord.metadata.creationTime,
                        testsTaken: 0,
                        avgScore: 0,
                        totalScore: 0, // Temp for calc
                        lastActive: userRecord.metadata.lastSignInTime || userRecord.metadata.creationTime,
                        source: 'firebase'
                    };
                });
             } catch (firebaseErr) {
                 console.error("Error fetching Firebase users:", firebaseErr);
                 // Continue without crashing
             }
        }

        // 1. Extract/Merge from Queries
        queries.forEach(q => {
            let uid = q.uid;
            let isGuest = false;

            // If no UID, try to identify by phone or email
            if (!uid) {
                if (q.phone) {
                    uid = `guest_phone_${q.phone}`;
                    isGuest = true;
                } else if (q.email) {
                    uid = `guest_email_${q.email}`;
                    isGuest = true;
                }
            }

            if (!uid) return; // Skip if absolutely no identifier

            if (!students[uid]) {
                students[uid] = {
                    uid: uid,
                    name: q.name || 'Unknown Guest',
                    email: q.email || 'N/A',
                    phone: q.phone || 'N/A',
                    joinedAt: q.createdAt,
                    testsTaken: 0,
                    avgScore: 0,
                    totalScore: 0,
                    lastActive: q.createdAt,
                    source: isGuest ? 'guest_query' : 'legacy'
                };
            } else {
                // Enrich existing record (Firebase or previous)
                if (q.name && (students[uid].name === 'Unknown' || students[uid].name === 'Firebase User')) students[uid].name = q.name;
                if (q.email && students[uid].email === 'N/A') students[uid].email = q.email;
                if (q.phone && students[uid].phone === 'N/A') students[uid].phone = q.phone;
                
                 if (new Date(q.createdAt) > new Date(students[uid].lastActive)) {
                    students[uid].lastActive = q.createdAt;
                }
            }
        });

        // 2. Extract/Update from Legacy Mock Tests
        legacyTests.forEach(t => {
            if (!t.uid) return; // Legacy tests usually have UIDs.
            
            if (!students[t.uid]) {
                students[t.uid] = {
                    uid: t.uid,
                    name: 'Student (No Query)',
                    email: 'N/A',
                    phone: 'N/A',
                    joinedAt: t.createdAt,
                    testsTaken: 0,
                    avgScore: 0,
                    totalScore: 0,
                    lastActive: t.createdAt,
                    source: 'legacy'
                };
            }
            const s = students[t.uid];
            s.testsTaken++;
            s.totalScore = (s.totalScore || 0) + (parseInt(t.score) || 0);
            if (new Date(t.createdAt) > new Date(s.lastActive)) {
                s.lastActive = t.createdAt;
            }
        });

        // 3. Extract/Update from MongoDB Attempts
        const mongoAttempts = await Attempt.find({}).sort({ submitTime: -1 });

        for (const attempt of mongoAttempts) {
            const uid = attempt.userId;
            if (!uid || uid === 'guest_user') continue; 

            if (!students[uid]) {
                students[uid] = {
                    uid: uid,
                    name: 'App User', 
                    email: 'N/A',
                    phone: 'N/A',
                    joinedAt: attempt.submitTime,
                    testsTaken: 0,
                    avgScore: 0,
                    totalScore: 0,
                    lastActive: attempt.submitTime,
                    source: 'online'
                };
            }
            const s = students[uid];
            s.testsTaken++;
            s.totalScore = (s.totalScore || 0) + (attempt.score || 0);
             if (new Date(attempt.submitTime) > new Date(s.lastActive)) {
                s.lastActive = attempt.submitTime;
            }
        }

        // 4. Finalize Stats
        const studentList = Object.values(students).map(s => {
            if (s.testsTaken > 0) {
                s.avgScore = Math.round(s.totalScore / s.testsTaken);
            }
            delete s.totalScore;
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
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const queries = readJSON(QUERIES_FILE);
        const legacyTests = readJSON(MOCK_TESTS_FILE);

        let studentQueries = [];
        let studentLegacyTests = [];
        
        // Handle Guest/Synthetic UIDs
        if (uid.startsWith('guest_phone_')) {
            const phone = uid.replace('guest_phone_', '');
            studentQueries = queries.filter(q => q.phone === phone);
        } else if (uid.startsWith('guest_email_')) {
            const email = uid.replace('guest_email_', '');
            studentQueries = queries.filter(q => q.email === email);
        } else {
            // Standard UID
            studentQueries = queries.filter(q => q.uid === uid);
            studentLegacyTests = legacyTests.filter(t => t.uid === uid);
        }

        // Fetch MongoDB attempts (Only if not a guest)
        let mongoAttempts = [];
        if (!uid.startsWith('guest_')) {
             mongoAttempts = await Attempt.find({ userId: uid })
            .populate('testId', 'title totalMarks')
            .sort({ submitTime: -1 });
        }

        // Try checking Firebase for profile info if standard UID
        let firebaseUser = null;
        if (!uid.startsWith('guest_') && firebaseAdminWrapper.isInitialized && firebaseAdminWrapper.admin) {
             try {
                 firebaseUser = await firebaseAdminWrapper.admin.auth().getUser(uid);
             } catch(e) {
                 // ignore if not found
             }
        }

        if (studentQueries.length === 0 && studentLegacyTests.length === 0 && mongoAttempts.length === 0 && !firebaseUser) {
            return res.status(404).json({ ok: false, message: 'Student not found' });
        }

        // Basic Info Construction
        let profile = {
            uid,
            name: 'Unknown',
            email: 'N/A',
            phone: 'N/A',
            joinedAt: ''
        };

        if (firebaseUser) {
            profile.name = firebaseUser.displayName || 'Firebase User';
            profile.email = firebaseUser.email || 'N/A';
            profile.phone = firebaseUser.phoneNumber || 'N/A';
            profile.joinedAt = firebaseUser.metadata.creationTime;
        }

        // Override/Enrich with query data if available
        if (studentQueries.length > 0) {
            const q = studentQueries[0];
            if (!profile.name || profile.name === 'Unknown' || profile.name === 'Firebase User') profile.name = q.name || profile.name;
            if (profile.email === 'N/A') profile.email = q.email || profile.email;
             if (profile.phone === 'N/A') profile.phone = q.phone || profile.phone;
            if (!profile.joinedAt) profile.joinedAt = q.createdAt;
        } else if (studentLegacyTests.length > 0) {
             if (!profile.joinedAt) profile.joinedAt = studentLegacyTests[0].createdAt;
        } else if (mongoAttempts.length > 0) {
             if (profile.name === 'Unknown') profile.name = 'App User';
             if (!profile.joinedAt) profile.joinedAt = mongoAttempts[mongoAttempts.length - 1].submitTime;
        }

        // Combine Tests for History
        const normalizedHistory = [];

        studentLegacyTests.forEach(t => {
            normalizedHistory.push({
                id: t.id,
                testName: t.testName || 'Legacy Test',
                score: parseInt(t.score) || 0,
                totalMarks: 720,
                date: t.date || t.createdAt,
                source: 'legacy'
            });
        });

        mongoAttempts.forEach(a => {
            normalizedHistory.push({
                id: a._id,
                testName: a.testId?.title || 'Online Test',
                score: a.score,
                totalMarks: a.testId?.totalMarks || 720,
                date: a.submitTime,
                source: 'online'
            });
        });

        // Calculate Stats
        const stats = {
            testsTaken: normalizedHistory.length,
            avgScore: 0,
            highestScore: 0,
            queriesAsked: studentQueries.length
        };

        let totalScore = 0;
        normalizedHistory.forEach(t => {
            totalScore += t.score;
            if (t.score > stats.highestScore) stats.highestScore = t.score;
        });
        if (stats.testsTaken > 0) stats.avgScore = Math.round(totalScore / stats.testsTaken);

        res.json({
            ok: true,
            profile,
            stats,
            history: {
                tests: normalizedHistory.sort((a, b) => new Date(b.date) - new Date(a.date)),
                queries: studentQueries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            }
        });

    } catch (err) {
        console.error("Get student detail error:", err);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
