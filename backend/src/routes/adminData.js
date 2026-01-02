const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Middleware to verify admin (Reusing logic from admin.js effectively, but let's re-implement or import if possible.
// For now, I'll inline a simple version or expect it to be passed.
// Actually, server.js can apply the middleware. I'll assume valid admin reaches here if configured correctly in server.js,
// BUT for safety, let's verify again or rely on the middleware applied at the router level in server.js.
// Current admin.js has its own verifyAdmin. Ideally, this should be a shared middleware.
// For this implementation, I will rely on the caller (server.js) to attach the middleware, OR duplicate it for safety.
// Let's duplicate strictly for this route to ensure self-containment for now, or better yet, export it from a common place?
// Given the constraints, I'll implement a local check or rely on server.js applying it.
// Checking server.js... it applies middlewares per route.
// I will implement a local verifyAdmin here to be safe.

const verifyAdmin = async (req, res, next) => {
    try {
        const devKey = process.env.ADMIN_KEY || 'changeme';
        const incomingKey = (req.get('x-admin-key') || '').trim();

        if (incomingKey === devKey) {
            req.adminVerified = { method: 'dev-key' };
            return next();
        }

        const authHeader = (req.get('authorization') || '').trim();
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: 'Missing idToken' });
        }

        const idToken = authHeader.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        if (decoded && (decoded.admin === true || decoded.isAdmin === true)) {
            req.adminVerified = { method: 'firebase', uid: decoded.uid };
            return next();
        }
        return res.status(403).json({ ok: false, message: 'Not an admin' });
    } catch (e) {
        console.error("Admin verify error:", e);
        return res.status(401).json({ ok: false, message: 'Auth failed' });
    }
};

// Define allowed directories
const DATA_DIRS = {
    'root_data': path.join(__dirname, '../../data'), // Pointing to backend/data now as root data is merged
    'backend_data': path.join(__dirname, '../../data')
};

// Helper: Ensure path is within allowed dirs
const getSafePath = (dirKey, filename) => {
    const baseDir = DATA_DIRS[dirKey];
    if (!baseDir) throw new Error("Invalid directory key");
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error("Invalid filename");
    }
    return path.join(baseDir, filename);
};

// GET /list - List files in both directories
router.get('/list', verifyAdmin, (req, res) => {
    try {
        const result = {};
        for (const [key, dirPath] of Object.entries(DATA_DIRS)) {
            if (fs.existsSync(dirPath)) {
                result[key] = fs.readdirSync(dirPath).filter(f => !f.startsWith('.')); // Exclude hidden files
            } else {
                result[key] = [];
            }
        }
        res.json({ ok: true, files: result });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

// GET /read - Read file content
router.get('/read', verifyAdmin, (req, res) => {
    try {
        const { dir, filename } = req.query;
        const filePath = getSafePath(dir, filename);

        if (!fs.existsSync(filePath)) {
            // Return 200 with specific fields to avoid browser console 404 error
            return res.json({ ok: false, code: 'FILE_NOT_FOUND', message: 'File not found' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ ok: true, content });
    } catch (e) {
        res.status(400).json({ ok: false, message: e.message });
    }
});

// POST /write - Create or Update file
router.post('/write', verifyAdmin, express.json({ limit: '50mb' }), (req, res) => {
    try {
        const { dir, filename, content } = req.body;
        const filePath = getSafePath(dir, filename);

        // Ensure directory exists (it should, but strictly speaking)
        if (!fs.existsSync(DATA_DIRS[dir])) fs.mkdirSync(DATA_DIRS[dir], { recursive: true });

        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ ok: true, message: 'File saved successfully' });
    } catch (e) {
        console.error("Write error:", e);
        res.status(500).json({ ok: false, message: e.message });
    }
});

// POST /delete
router.post('/delete', verifyAdmin, express.json(), (req, res) => {
    try {
        const { dir, filename } = req.body;
        const filePath = getSafePath(dir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ ok: true, message: 'File deleted' });
        } else {
            res.status(404).json({ ok: false, message: 'File not found' });
        }
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

module.exports = router;
