const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const PYQ_DIR = path.join(__dirname, '../../data/physisPYQ');

const isPdf = (fileName) => path.extname(fileName).toLowerCase() === '.pdf';

// GET /: List chapters from data/quizzes
router.get('/', (req, res) => {
    try {
        const QUIZ_DIR = path.join(__dirname, '../data/quizzes');
        if (!fs.existsSync(QUIZ_DIR)) {
            return res.status(500).json({ ok: false, error: 'Data directory not found' });
        }
        const files = fs.readdirSync(QUIZ_DIR);
        const chapters = files
            .filter(f => f.endsWith('.json') && !f.includes('test_series_db') && !f.includes('user_mock_tests') && !f.includes('corrections') && !f.includes('distribution'))
            .map(file => ({
                fileName: file.replace('.json', '_New_Clean.pdf'), // Hack to maintain frontend compatibility which expects PDF filename
                displayName: file.replace('.json', '').replace(/_/g, ' ')
            }));
        res.json({ ok: true, chapters });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: 'List failed' });
    }
});

// Helper to process PDF
const processPdf = async (filename, mode) => {
    const filePath = path.join(PYQ_DIR, filename);
    if (!fs.existsSync(filePath)) throw new Error('File not found');

    const fileBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) throw new Error('Empty PDF');

    const newPdf = await PDFDocument.create();

    if (mode === 'questions') {
        const pagesToInclude = pageCount > 1 ? Array.from({ length: pageCount - 1 }, (_, i) => i) : [0];
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToInclude);

        copiedPages.forEach(page => {
            const { width } = page.getSize();
            page.drawRectangle({
                x: 0,
                y: 0,
                width: width,
                height: 40,
                color: rgb(1, 1, 1),
            });
            newPdf.addPage(page);
        });
    } else if (mode === 'key') {
        const lastPageIndex = pageCount - 1;
        const copiedPages = await newPdf.copyPages(pdfDoc, [lastPageIndex]);
        copiedPages.forEach(page => newPdf.addPage(page));
    } else if (mode === 'original') {
        return fileBuffer;
    }

    return await newPdf.save();
};

// GET /:filename/questions - Returns PDF without last page and with masked footer
router.get('/:filename/questions', async (req, res) => {
    try {
        const pdfBytes = await processPdf(req.params.filename, 'questions');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing PDF');
    }
});

// GET /:filename/key - Returns only last page
router.get('/:filename/key', async (req, res) => {
    try {
        const pdfBytes = await processPdf(req.params.filename, 'key');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing PDF');
    }
});

// GET /:filename/parsed - Returns parsed JSON if available
router.get('/:filename/parsed', async (req, res) => {
    try {
        const { filename } = req.params;

        // New Logic: Check in backend/data/quizzes
        const QUIZ_DIR = path.join(__dirname, '../data/quizzes');

        // Remove suffixes to find the base name
        const baseName = filename.replace('_New_Clean.pdf', '').replace('.pdf', '');
        const jsonName = `${baseName}.json`;
        const jsonPath = path.join(QUIZ_DIR, jsonName);

        if (fs.existsSync(jsonPath)) {
            const data = fs.readFileSync(jsonPath, 'utf8');
            res.json({ ok: true, data: JSON.parse(data) });
        } else {
            console.warn(`JSON not found at: ${jsonPath}`);
            res.json({ ok: false, error: 'Parsed version not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Error serving parsed file' });
    }
});

// Legacy route (Raw)
router.get('/:filename', async (req, res) => {
    try {
        const filePath = path.join(PYQ_DIR, req.params.filename);
        if (fs.existsSync(filePath)) res.sendFile(filePath);
        else res.status(404).json({ ok: false });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

module.exports = router;
