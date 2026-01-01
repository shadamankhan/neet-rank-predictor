const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let keralaData = [];
const CSV_FILE = 'keralaprivate2025r1r2.csv';

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
    const cleaned = val.toString().replace(/,/g, '').replace(/₹/g, '').replace(/ /g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '--') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [Kerala] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        keralaData = records.map(row => {
            return {
                code: row['Code'],
                collegeName: row['Medical College Name'],
                fees: parseFee(row['Tuition Fees/Year']),
                estd: row['Year of ESTB'],
                cutoffs: {
                    2025: {
                        r1: {
                            rank: parseNum(row['AI Rank 2025 Round 1 ']), // Note the trailing space in CSV header
                            score: parseNum(row['Score R1 2025'])
                        },
                        r2: {
                            rank: parseNum(row['AI Rank 2025 Round 2']),
                            score: parseNum(row['Score R2 2025'])
                        }
                    },
                    2024: {
                        r1: {
                            rank: parseNum(row['Round-1 Rank 2024']),
                            score: parseNum(row['Round-1 Score 2024'])
                        },
                        r2: {
                            rank: parseNum(row['Round-2 Rank 2024']),
                            score: parseNum(row['Round-2 Score 2024'])
                        }
                    }
                }
            };
        });

        console.log(`✅ [Kerala] Loaded ${keralaData.length} colleges.`);

    } catch (e) {
        console.error("❌ [Kerala] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/keralaprivate/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: keralaData.length,
            data: keralaData
        });
    } catch (e) {
        console.error("Error in /api/keralaprivate/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
