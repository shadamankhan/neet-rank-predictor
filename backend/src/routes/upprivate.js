const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let upPrivateData = [];
const CSV_FILE = 'utterpardashprivate2025.csv';

/**
 * Helper to clean rank/score strings
 */
const parseNum = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === 'xx' || cleaned === 'na') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Helper to clean currency strings
 */
const parseFee = (val) => {
    if (!val) return null;
    // Remove ₹, commas, spaces
    const cleaned = val.toString().replace(/,/g, '').replace(/₹/g, '').replace(/ /g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '–' || cleaned.toLowerCase().includes('na')) return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [UP Private] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        upPrivateData = records.map(row => {
            return {
                collegeName: row['College Name'],
                fees: parseFee(row['Budget']),
                cutoffs: {
                    r1: {
                        rank: parseNum(row['Round1 Rank 2025']),
                        score: parseNum(row['Round1 Score'])
                    },
                    r2: {
                        rank: parseNum(row['Round2 Rank 2025']),
                        score: parseNum(row['Round2 Score'])
                    },
                    scoreChange: parseNum(row['Score Change'])
                }
            };
        });

        console.log(`✅ [UP Private] Loaded ${upPrivateData.length} colleges.`);

    } catch (e) {
        console.error("❌ [UP Private] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/upprivate/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: upPrivateData.length,
            data: upPrivateData
        });
    } catch (e) {
        console.error("Error in /api/upprivate/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
