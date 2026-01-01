const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let biharData = [];
const CSV_FILE = 'biharprivate2025r1r2.csv';

/**
 * Helper to clean rank/score strings
 */
const parseNum = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === '--' || cleaned.includes('na')) return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Helper to clean currency strings
 */
const parseFee = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').replace(/₹/g, '').replace(/ /g, '').replace(/\$/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '--') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [Bihar] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        biharData = records.map(row => {
            return {
                collegeName: row['College Name'],
                estd: row['year of estb.'],

                // UR Category
                ur: {
                    fees: row['Fees (₹/USD)'],
                    r1: parseNum(row['R-1 Rank']),
                    r2: parseNum(row['R-2 Rank'])
                },

                // NRI Category
                nri: {
                    available: !!row['Category nri'],
                    fees: row['Fees (₹/USD) nri'],
                    r1: parseNum(row['R-1 Rank nri']),
                    r2: parseNum(row['R-2 Rank nri'])
                },

                // Other Category (SM/MM)
                other: {
                    category: row['Category oth'],
                    available: !!row['Category oth'],
                    fees: row['Fees (₹/USD) oth'],
                    r1: parseNum(row['R-1 Rank oth']),
                    r2: parseNum(row['R-2 Rank oth'])
                }
            };
        });

        console.log(`✅ [Bihar] Loaded ${biharData.length} colleges.`);

    } catch (e) {
        console.error("❌ [Bihar] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/biharprivate/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: biharData.length,
            data: biharData
        });
    } catch (e) {
        console.error("Error in /api/biharprivate/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
