const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let haryanaData = [];
const CSV_FILE = 'haryanaprivate2025r1r2.csv';

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
    // Handle ranges or complex strings if necessary, for now simple parse
    // Some entries might be "12,00,000-16,37,500", taking the first one if range
    const rangeMatch = cleaned.match(/^(\d+)-/);
    if (rangeMatch) {
        return Number(rangeMatch[1]);
    }

    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Helper to preserve original fee string for display if needed
 */
const cleanString = (val) => {
    if (!val) return '';
    return val.toString().trim();
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [Haryana Private] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        haryanaData = records.map(row => {
            return {
                collegeName: row['College Name'],
                estYear: row['Establishment Year'],
                category: row['Category'],
                fees: cleanString(row['Yearly MBBS Fee (₹)']),
                hostelFees: cleanString(row['Hostel Fee (₹)']),
                notes: row['Notes'],
                open: {
                    r1: {
                        rank: parseNum(row['OPEN R1 Rank']),
                        score: parseNum(row['OPEN R1 Score'])
                    },
                    r2: {
                        rank: parseNum(row['OPEN R2 Rank']),
                        score: parseNum(row['OPEN R2 Score'])
                    }
                },
                mgt: {
                    r1: {
                        rank: parseNum(row['MGT R1 Rank']),
                        score: parseNum(row['MGT R1 Score'])
                    },
                    r2: {
                        rank: parseNum(row['MGT R2 Rank']),
                        score: parseNum(row['MGT R2 Score'])
                    }
                }
            };
        });

        console.log(`✅ [Haryana Private] Loaded ${haryanaData.length} colleges.`);

    } catch (e) {
        console.error("❌ [Haryana Private] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/haryanaprivate/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: haryanaData.length,
            data: haryanaData
        });
    } catch (e) {
        console.error("Error in /api/haryanaprivate/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
