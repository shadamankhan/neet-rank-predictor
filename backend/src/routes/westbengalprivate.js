const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let wbData = [];
const CSV_FILE = 'westbengal2025r1r2.csv';

/**
 * Helper to clean rank/score strings
 */
const parseNum = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === 'xx' || cleaned === 'xxx' || cleaned === 'na') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Helper to clean strings
 */
const cleanString = (val) => {
    if (!val) return '';
    return val.toString().trim();
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [West Bengal Private] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        wbData = records.map(row => {
            return {
                collegeName: row['Institute Name'],
                estYear: row['Year Est.'],
                intake: row['Annual Intake'],
                fees: cleanString(row['Mgmt. Quota Fee (₹/year)']),
                r1: {
                    rank: parseNum(row['Round-1 Rank']),
                    score: parseNum(row['Round-1 Score'])
                },
                r2: {
                    rank: parseNum(row['Round-2 Rank']),
                    score: parseNum(row['Round-2 Score'])
                }
            };
        });

        console.log(`✅ [West Bengal Private] Loaded ${wbData.length} colleges.`);

    } catch (e) {
        console.error("❌ [West Bengal Private] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/westbengalprivate/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: wbData.length,
            data: wbData
        });
    } catch (e) {
        console.error("Error in /api/westbengalprivate/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
