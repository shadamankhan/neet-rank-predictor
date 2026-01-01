// src/routes/testSeries.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/test_series_db.json');
const QUIZZES_DIR = path.join(__dirname, '../../data/quizzes');

// Helper to read DB
const getDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading test_series_db:", err);
        return null; // Handle gracefully
    }
};

// GET /api/test-series/dashboard
// Returns data for the main dashboard
router.get('/dashboard', (req, res) => {
    const db = getDB();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Transform data for dashboard consumption
    // We want a flat list of testBundles for the tabs
    const testBundles = {};

    // Group tests by category logic (simplified for now)
    // In our DB, 'series' contains 'tests'. 
    // We map 'series' to the categories.

    db.series.forEach(series => {
        if (!testBundles[series.categoryId]) {
            testBundles[series.categoryId] = [];
        }
        // Add tests from this series to the bundle list
        // In a real app, you might show the SERIES card, not individual tests.
        // But for our current UI, we showed lists of tests.
        // Let's modify the UI to show Series or Tests. 
        // For now, let's just flatten the structure to match the frontend expectations:
        // categories: [free, chapter, full...]

        series.tests.forEach(test => {
            testBundles[series.categoryId].push({
                ...test,
                price: series.price, // Inherit series price
                seriesTitle: series.title
            });
        });
    });

    res.json({
        upcomingTest: db.upcomingTest,
        categories: db.categories,
        testBundles: testBundles
    });
});

// GET /api/test-series/:seriesId
// Returns details for a specific Bundle/Series
router.get('/:seriesId', (req, res) => {
    const db = getDB();
    const series = db.series.find(s => s.id === req.params.seriesId);
    if (!series) return res.status(404).json({ error: "Series not found" });
    res.json(series);
});

// GET /api/test-series/test/:testId
// Returns the actual Questions for the Exam Engine
router.get('/test/:testId', (req, res) => {
    const db = getDB();
    const testId = req.params.testId;

    // Find the test across all series
    let foundTest = null;
    let foundSeries = null;

    for (const s of db.series) {
        const t = s.tests.find(t => t.id === testId);
        if (t) {
            foundTest = t;
            foundSeries = s;
            break;
        }
    }

    if (!foundTest) return res.status(404).json({ error: "Test not found" });

    // Now read the actual Quiz JSON file
    const quizFilePath = path.join(QUIZZES_DIR, foundTest.file);
    if (!fs.existsSync(quizFilePath)) {
        return res.status(500).json({ error: `Quiz file missing: ${foundTest.file}` });
    }

    try {
        const quizData = JSON.parse(fs.readFileSync(quizFilePath, 'utf8'));

        // Transform into Exam Engine format if necessary
        // Our Exam Engine expects: { title, duration, sections: [], questions: { physics: [], chemistry: ... } }
        // The raw JSON is an array of questions or an object.
        // Most of our raw JSONs are just simple arrays of questions for a specific chapter (e.g. Alcohols).
        // Since we are using "Alcohols" as a placeholder for a "Full Mock", we need to fake the sections.

        // Let's simulate a Sectioned Paper from this single file
        // Divide questions into sections arbitrarily for demo

        const safeQuestions = Array.isArray(quizData) ? quizData : (quizData.questions || []);

        const sections = ['Physics', 'Chemistry', 'Biology'];
        const questionsBySection = {
            Physics: [],
            Chemistry: [],
            Biology: []
        };

        // Distribute for demo (first 10 Phy, next 10 Chem, rest Bio)
        safeQuestions.forEach((q, idx) => {
            let section = 'Biology';
            if (idx < 10) section = 'Physics';
            else if (idx < 20) section = 'Chemistry';

            // Ensure ID exists
            q.id = q.id || `q-${idx}`;
            q.qNo = idx + 1;

            questionsBySection[section].push(q);
        });

        res.json({
            id: foundTest.id,
            title: foundTest.title,
            duration: foundTest.time * 60, // minutes to seconds
            sections: sections,
            questions: questionsBySection
        });

    } catch (err) {
        console.error("Error parsing quiz file:", err);
        res.status(500).json({ error: "Failed to parse test data" });
    }
});

module.exports = router;
