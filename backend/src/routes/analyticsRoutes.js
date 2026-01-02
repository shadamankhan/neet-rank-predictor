const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_PATH_TRENDS = path.join(__dirname, '../../data/Neet2016to2025rankvsmarks50000rank.csv');
const DATA_PATH_AIQ = path.join(__dirname, '../../data/15percentAIQCutoff5years.csv');
const DATA_PATH_MARKS_HISTORY = path.join(__dirname, '../../data/marksvsrank720to150marks.csv');

// --- In-Memory Cache ---
let cachedTrends = null;
let cachedAiq = null;
let cachedMarksHistory = null;

const loadAnalyticsData = () => {
    try {
        console.log(`[Analytics] Trends Path: ${DATA_PATH_TRENDS}`);
        // 1. Load Trends (and Downsample)
        if (fs.existsSync(DATA_PATH_TRENDS)) {
            const fileContent = fs.readFileSync(DATA_PATH_TRENDS, 'utf-8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });

            const fullData = records.map(record => {
                const newRecord = { rank: parseInt(record.AIR.replace(/,/g, ''), 10) || 0 };
                Object.keys(record).forEach(key => {
                    if (key.startsWith('Marks ')) {
                        const year = key.split(' ')[1];
                        const value = parseInt(record[key], 10);
                        if (!isNaN(value)) newRecord[year] = value;
                    }
                });
                return newRecord;
            });

            // Source file is already summarized (e.g., 100, 200, 500... 50000)
            // No need to downsample further.
            cachedTrends = fullData;
            console.log(`✅ [Analytics] Loaded Trends: ${cachedTrends.length} rows`);
        }

        // 2. Load AIQ Data
        if (fs.existsSync(DATA_PATH_AIQ)) {
            const fileContent = fs.readFileSync(DATA_PATH_AIQ, 'utf-8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
            cachedAiq = records.map(r => {
                const newR = { year: r["Exam year"] };
                Object.keys(r).forEach(k => {
                    if (k !== "Exam year") newR[k] = parseInt(r[k]) || null;
                });
                return newR;
            });
            console.log(`✅ [Analytics] Loaded AIQ Data: ${cachedAiq.length} rows`);
        }

        // 3. Load Marks History
        if (fs.existsSync(DATA_PATH_MARKS_HISTORY)) {
            const fileContent = fs.readFileSync(DATA_PATH_MARKS_HISTORY, 'utf-8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
            cachedMarksHistory = records.map(r => {
                const newR = { marks: parseInt(r.Marks) || 0 };
                Object.keys(r).forEach(k => {
                    if (k.startsWith("Rank ")) {
                        const year = k.split(" ")[1];
                        newR[year] = parseInt(r[k]) || 0;
                    }
                });
                return newR;
            });
            console.log(`✅ [Analytics] Loaded Marks History: ${cachedMarksHistory.length} rows`);
        }

    } catch (err) {
        console.error("❌ [Analytics] Error loading data:", err.message);
    }
};

// Initialize Payload
loadAnalyticsData();

router.get('/rank-trends', (req, res) => {
    if (!cachedTrends) return res.status(503).json({ error: 'Data loading...' });
    res.json(cachedTrends);
});

router.get('/aiq-cutoffs', (req, res) => {
    if (!cachedAiq) return res.status(503).json({ error: 'Data loading...' });
    res.json(cachedAiq);
});

router.get('/marks-rank-history', (req, res) => {
    if (!cachedMarksHistory) return res.status(503).json({ error: 'Data loading...' });
    res.json(cachedMarksHistory);
});

module.exports = router;
