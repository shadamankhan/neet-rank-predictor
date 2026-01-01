const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const PYQ_DIR = path.join(__dirname, '../../data/chemistryPYQ');

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
            .filter(f => f.endsWith('.json') && !f.includes('test_series_db') && !f.includes('user_mock_tests'))
            .map(file => ({
                fileName: file.replace('.json', '_New_Clean.pdf'), // Hack to allow frontend to request "Parsed"
                displayName: file.replace('.json', '').replace(/_/g, ' ')
            }));
        res.json({ ok: true, chapters });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: 'List failed' });
    }
});

const QUIZ_QUIZ_DIR = path.join(__dirname, '../data/quizzes');

// GET /pdfs: List generated Quiz PDFs
router.get('/pdfs', (req, res) => {
    try {
        if (!fs.existsSync(QUIZ_QUIZ_DIR)) {
            return res.json({ ok: true, chapters: [] });
        }
        const files = fs.readdirSync(QUIZ_QUIZ_DIR);
        const pdfs = files
            .filter(f => f.endsWith('.pdf'))
            .map(file => ({
                fileName: file,
                displayName: file.replace('.pdf', '').replace(/_/g, ' '),
                url: `/data/quizzes/${file}`
            }));
        res.json({ ok: true, chapters: pdfs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: 'List PDFs failed' });
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
        // Copy all pages EXCEPT the last one (assuming last is key)
        // If there's only 1 page, we return it as is (or maybe it IS the key? Edge case).
        // Let's assume if > 1 page, last is key.

        const pagesToInclude = pageCount > 1 ? Array.from({ length: pageCount - 1 }, (_, i) => i) : [0];
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToInclude);

        copiedPages.forEach(page => {
            // Mask Footer (Bottom 50 units?)
            // Page coordinates are usually bottom-left origin.
            const { width } = page.getSize();
            page.drawRectangle({
                x: 0,
                y: 0,
                width: width,
                height: 40, // Height of the mask at bottom
                color: rgb(1, 1, 1), // White
            });
            newPdf.addPage(page);
        });
    } else if (mode === 'key') {
        // Return ONLY the last page
        const lastPageIndex = pageCount - 1;
        const copiedPages = await newPdf.copyPages(pdfDoc, [lastPageIndex]);
        copiedPages.forEach(page => newPdf.addPage(page));
    } else if (mode === 'original') {
        return fileBuffer; // Serve raw
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
        // Filename comes in as 'AMINES_New_Clean.pdf'
        // We want 'AMINES_parsed.json' or 'AMINES - 20 Years..._parsed.json'
        // The mapping is: <CleanPDFName>.replace('_New_Clean.pdf', '_parsed.json')

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
