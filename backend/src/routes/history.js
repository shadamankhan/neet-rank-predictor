const express = require('express');
const router = express.Router();
const firebaseAdmin = require('../../firebaseAdmin');
const admin = firebaseAdmin.admin;
const firestore = admin ? admin.firestore() : null;

// Middleware to extract and verify ID token
async function verifyUser(req, res, next) {
    if (!firebaseAdmin.isInitialized || !admin) {
        return res.status(500).json({ ok: false, message: 'Server misconfigured' });
    }

    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, message: 'Missing token' });
    }
    const idToken = authHeader.slice(7).trim();

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded; // { uid, email, ... }
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
}

// GET /api/history - Get current user's history
router.get('/', verifyUser, async (req, res) => {
    try {
        const uid = req.user.uid;
        // Query: predictions where userId == uid
        const snapshot = await firestore.collection('predictions')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to simple ISO string for frontend
            timestamp: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
        }));

        res.json({ ok: true, items });
    } catch (err) {
        console.error('History GET user error:', err);
        // If index is missing, firestore throws an error with a link.
        // We catch it here.
        res.status(500).json({ ok: false, message: err.message });
    }
});

// DELETE /api/history/:id - Delete a prediction
router.delete('/:id', verifyUser, async (req, res) => {
    try {
        const uid = req.user.uid;
        const docId = req.params.id;

        const docRef = firestore.collection('predictions').doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ ok: false, message: 'Not found' });
        }

        const data = doc.data();
        if (data.userId !== uid) {
            return res.status(403).json({ ok: false, message: 'Unauthorized' });
        }

        await docRef.delete();
        res.json({ ok: true, id: docId });
    } catch (err) {
        console.error('History DELETE error:', err);
        res.status(500).json({ ok: false, message: err.message });
    }
});

module.exports = router;
