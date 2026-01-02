const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let karnatakaData = [];
// availableTypes (e.g. Private Unaided, Minority, Deemed)
let availableTypes = new Set();
const CSV_FILE = 'nonkarnatakafees_r1_r2_r3_2025.csv';

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
    const cleaned = val.toString().replace(/,/g, '').replace(/₹/g, '').replace(/ /g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '–' || cleaned.toLowerCase().includes('na')) return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [Karnataka] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Map to clean structure
        karnatakaData = records.map(row => {
            const type = row['COLLEGE TYPE'] || 'Unknown';
            availableTypes.add(type);

            return {
                code: row['CLG CODE'],
                collegeName: row['COLLEGE NAME'],
                type: type,

                // Fees
                fees: {
                    private: parseFee(row['Private (P) Fees']),
                    nri: parseFee(row['NRI(N) Fees']),
                    other: parseFee(row['OTHER(Q) Fees'])
                },

                // Cutoffs (Rank usually, sometimes blank if seats not available)
                cutoffs: {
                    open: {
                        r1: { rank: parseNum(row['Closing rank OPN R1']), score: null }, // Score not explicitly in CSV headers shown
                        r2: { rank: parseNum(row['Closing rank OPN R2']), score: null },
                        r3: { rank: parseNum(row['OPEN R3']), score: null } // Assuming rank for R3 based on column name context
                    },
                    other: {
                        r1: { rank: parseNum(row['OTH (Q) R1']), score: null }, // Assuming this is rank or seats? usually header implies. Let's assume Rank data based on context otherwise it's just seat availability
                        r2: { rank: parseNum(row['Closing rank OTH R2']), score: null },
                        r3: { rank: parseNum(row['OTHER R3']), score: null }
                    },
                    nri: {
                        r1: { rank: parseNum(row['NRI R1']), score: null },
                        r2: { rank: parseNum(row['NRI R2']), score: null },
                        r3: { rank: parseNum(row['NRI R3']), score: null }
                    }
                }
            };
        });

        console.log(`✅ [Karnataka] Loaded ${karnatakaData.length} colleges.`);

    } catch (e) {
        console.error("❌ [Karnataka] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/karnataka/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: karnatakaData.length,
            types: Array.from(availableTypes).sort(),
            data: karnatakaData
        });
    } catch (e) {
        console.error("Error in /api/karnataka/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
