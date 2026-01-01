const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const QUIZ_DIR = path.join(__dirname, '../data/quizzes');

// Helper to ensure dir exists
if (!fs.existsSync(QUIZ_DIR)) {
    fs.mkdirSync(QUIZ_DIR, { recursive: true });
}

// GET /pdfs: List all PDF files
router.get('/pdfs', (req, res) => {
    try {
        const files = fs.readdirSync(QUIZ_DIR).filter(f => f.endsWith('.pdf'));
        files.sort();

        const pdfs = files.map(f => ({
            filename: f,
            displayName: f.replace('.pdf', '').replace(/_/g, ' '),
            url: `/data/quizzes/${f}` // Assumes static serving is set up
        }));
        res.json({ ok: true, files: pdfs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to list PDFs' });
    }
});

// GET /: List all quiz files
router.get('/', (req, res) => {
    try {
        const files = fs.readdirSync(QUIZ_DIR).filter(f => f.endsWith('.json'));
        // Sort explicitly: Physics first, then Chemistry (or alphabetic)
        // Just alphabetic for now
        files.sort();

        const quizzes = files.map(f => ({
            filename: f,
            displayName: f.replace('.json', '').replace(/_/g, ' ')
        }));
        res.json({ ok: true, files: quizzes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to list quizzes' });
    }
});

// GET /:filename: Get content
router.get('/:filename', (req, res) => {
    try {
        const filePath = path.join(QUIZ_DIR, req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ ok: false, error: 'File not found' });
        }
        const data = fs.readFileSync(filePath, 'utf8');
        res.json({ ok: true, data: JSON.parse(data) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to read file' });
    }
});

// POST /:filename: Save content
router.post('/:filename', (req, res) => {
    try {
        const filePath = path.join(QUIZ_DIR, req.params.filename);
        const { data } = req.body; // Expecting { data: [Array of Questions] }

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ ok: false, error: 'Invalid data format' });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`[Admin] Updated quiz: ${req.params.filename}`);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to save file' });
    }
});

module.exports = router;
