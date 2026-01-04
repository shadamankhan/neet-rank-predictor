const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const QUIZZES_DIR = path.join(__dirname, '../data/quizzes');

// Helper to list files
// Helper to list files recursively
const getQuizFiles = (dir = QUIZZES_DIR, fileList = []) => {
    try {
        if (!fs.existsSync(dir)) return [];
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                getQuizFiles(filePath, fileList);
            } else if (file.endsWith('.json')) {
                // Return relative path from QUIZZES_DIR for easier frontend display
                const relativePath = path.relative(QUIZZES_DIR, filePath);
                fileList.push({
                    name: relativePath, // e.g. "physics/kinematics.json"
                    path: filePath,
                    size: stat.size
                });
            }
        });
        return fileList;
    } catch (err) {
        console.error("Error reading quiz directory:", err);
        return [];
    }
};

// GET /api/question-bank/files - List all JSON quiz files
router.get('/files', (req, res) => {
    const files = getQuizFiles();
    res.json({ ok: true, files });
});

// Helper to configure multer
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(QUIZZES_DIR)) {
            fs.mkdirSync(QUIZZES_DIR, { recursive: true });
        }
        cb(null, QUIZZES_DIR);
    },
    filename: (req, file, cb) => {
        // Keep original name but ensure .json extension if missing (though usually browser sends it)
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'));
        }
    }
});

// POST /api/question-bank/upload - Upload new quiz file
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, message: 'No file uploaded' });
        }
        res.json({ ok: true, message: 'File uploaded successfully', filename: req.file.filename });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ ok: false, message: 'Upload failed' });
    }
});

// GET /api/question-bank/files/* - Get content of a specific file (supports nested paths)
router.get('/files/*', (req, res) => {
    try {
        // req.params[0] contains the wildcard match (e.g. "physics/motion.json")
        const relativePath = req.params[0];
        if (!relativePath) {
            return res.status(400).json({ ok: false, message: 'Filename required' });
        }

        // Prevent directory traversal attacks
        const filePath = path.join(QUIZZES_DIR, relativePath);
        const relative = path.relative(QUIZZES_DIR, filePath);
        if (relative.startsWith('..') || path.isAbsolute(relativePath)) {
            return res.status(403).json({ ok: false, message: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ ok: false, message: 'File not found' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        try {
            const json = JSON.parse(content);
            res.json({ ok: true, data: json });
        } catch (parseErr) {
            res.status(500).json({ ok: false, message: 'Invalid JSON format in file' });
        }
    } catch (err) {
        console.error("Error reading file:", err);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});

// POST /api/question-bank/question - Add a single manual question
router.post('/question', (req, res) => {
    try {
        const question = req.body;
        if (!question || !question.question) {
            return res.status(400).json({ ok: false, message: 'Invalid question data' });
        }

        const manualFile = path.join(QUIZZES_DIR, 'manual_questions.json');
        let questions = [];

        if (fs.existsSync(manualFile)) {
            const content = fs.readFileSync(manualFile, 'utf8');
            try {
                questions = JSON.parse(content);
                if (!Array.isArray(questions)) questions = [];
            } catch (e) {
                questions = [];
            }
        }

        // Assign a new ID if needed
        question.id = question.id || Date.now();
        questions.push(question);

        fs.writeFileSync(manualFile, JSON.stringify(questions, null, 2));

        res.json({ ok: true, message: 'Question added successfully' });
    } catch (err) {
        console.error("Add question error:", err);
        res.status(500).json({ ok: false, message: 'Failed to save question' });
    }
});

module.exports = router;
