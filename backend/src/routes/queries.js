const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const adminAuth = require('../middleware/adminAuth'); // Import admin middleware

const DATA_FILE = path.join(__dirname, '../../data/user_queries.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    // Create dir if needed
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Write empty array
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

const readQueries = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading queries:", e);
        return [];
    }
};

const writeQueries = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing queries:", e);
        return false;
    }
};

// POST /api/queries/submit
router.post('/submit', (req, res) => {
    try {
        const { name, phone, rank, query, email, uid } = req.body; // Added email/uid
        if (!query) return res.status(400).json({ ok: false, message: "Query is required" });

        const queries = readQueries();
        const newQuery = {
            id: uuidv4(),
            uid: uid || null,   // Store uid for filtering
            email: email || null, // Store email for filtering (and display)
            name: name || 'Anonymous',
            phone: phone || '',
            rank: rank || 'Unknown',
            query,
            status: 'Pending',
            adminReply: '',
            createdAt: new Date().toISOString()
        };

        queries.unshift(newQuery); // Add to top
        writeQueries(queries);

        res.json({ ok: true, message: "Query submitted successfully", id: newQuery.id });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

// GET /api/queries/list (Admin Only - simplified check for now, relies on server.js mounting)
// Note: In server.js, we should ideally protect this route. 
// For now, I'll add a simple query param check or assume open for prototype as requested "real users" interaction.
// But to be proper, let's assume the frontend passes the admin token if needed. 
// Given the user wants "Real", I'll leave it open for fetch but frontend won't show link unless admin.
// GET /api/queries/list (Protected)
router.get('/list', adminAuth, (req, res) => {
    const queries = readQueries();
    res.json({ ok: true, queries });
});

// POST /api/queries/reply
// POST /api/queries/reply (Protected)
router.post('/reply', adminAuth, (req, res) => {
    try {
        const { id, reply, status } = req.body;
        const queries = readQueries();
        const index = queries.findIndex(q => q.id === id);

        if (index === -1) return res.status(404).json({ ok: false, message: "Query not found" });

        if (reply) queries[index].adminReply = reply;
        if (status) queries[index].status = status;

        writeQueries(queries);
        res.json({ ok: true, message: "Query updated" });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

// GET /api/queries/my-queries (Protected)
router.get('/my-queries', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: 'Missing auth token' });
        }
        const idToken = authHeader.split(' ')[1];

        // Verify token via admin route middleware logic (or direct admin.auth())
        // Since we are in queries.js, we can import admin from firebaseAdmin wrapper? 
        // Or just re-use a middleware. Let's do it inline for simplicity or reuse an auth middleware if available.
        // We will assume "admin" object is available globally or we require it.
        // Actually best to import admin here.
        const admin = require('firebase-admin');
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email;
        const userPhone = decodedToken.phone_number;

        const allQueries = readQueries();

        // Filter by email (if we stored it) or phone
        // Current submit flow stores: name, phone, review. 
        // It does NOT store email. We should update submit to store email if available? 
        // Or we match by phone if provided.
        // Wait, AskQueryModal sends manually entered phone. User might be logged in with Google (email).
        // Best approach: Add 'email' to the query object during submit if the user is logged in, 
        // OR filtering by phone is shaky if formats differ.

        // Let's filter by phone for now if it matches "phone" field. 
        // BUT better: Filter by `userId` (uid).
        // We need to update submit to include uid/email.

        const myQueries = allQueries.filter(q => {
            // Match by UID if we have it (we don't yet, need to update submit)
            if (q.uid && q.uid === decodedToken.uid) return true;

            // Fallback match by phone if available
            if (userPhone && q.phone === userPhone) return true;

            // Fallback match by email if available in query (we don't store it yet)
            if (q.email && q.email === userEmail) return true;

            return false;
        });

        res.json({ ok: true, queries: myQueries });
    } catch (e) {
        console.error("My Queries Error:", e);
        res.status(401).json({ ok: false, message: 'Invalid token or error fetching queries' });
    }
});

module.exports = router;
