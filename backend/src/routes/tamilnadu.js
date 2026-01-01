const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let tnData = [];
const CSV_FILE = 'tamilnaduPRIVATER1r22025.csv';

/**
 * Helper to clean rank/score strings
 */
const parseNum = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === '–' || cleaned === '—' || cleaned === 'xx' || cleaned === 'na') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const cleanString = (val) => {
    if (!val) return '';
    return val.toString().trim();
};

const loadData = () => {
    try {
        const filePath = path.join(__dirname, '../../../data', CSV_FILE);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [TN Private] File not found: ${CSV_FILE}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        // Manual parsing because of messy headers
        // Skip first 3 lines
        const lines = content.split(/\r?\n/);
        const dataLines = lines.slice(3); // Start from line 4

        // Rejoin and strict parse the data part
        // IMPORTANT: The file seems to use standard CSV formatting for data rows despite headers being messy.
        // If strict parsing fails, we might need manual line splitting.
        const dataContent = dataLines.join('\n');

        const records = parse(dataContent, {
            columns: false, // Index based access
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true // In case some rows have extra commas
        });

        tnData = records.map(row => {
            // Index mapping based on inspection:
            // 0: S.No (ignore)
            // 1: College Name
            // 2: MQ R2 Marks
            // 3: MQ R2 Rank
            // 4: TMQ R2 Marks
            // 5: TMQ R2 Rank
            // 6: MMQ R2 Marks
            // 7: MMQ R2 Rank
            // 8: NRI R2 Marks
            // 9: NRI R2 Rank
            // 10: CMQ R2 Marks
            // 11: CMQ R2 Rank
            // 12: Estb Year
            // 13: GM Fees
            // 14: MQ Fees
            // 15: NRI Fees
            // 16-17: Gov Quota stuff? (Ignore for now)
            // 17(Real): MQ R1 Marks (Index shifted?)

            // Let's re-verify indices based on visual inspection of row 4
            // Row 4: "1","TRICHY SRM...", ... 
            // The parser might treat the comma inside quotes correctly.

            // Let's try flexible extraction.
            if (!row[1]) return null;

            return {
                collegeName: cleanString(row[1]),
                estYear: cleanString(row[12]),
                fees: {
                    mq: cleanString(row[14]),
                    nri: cleanString(row[15]),
                    gm: cleanString(row[13])
                },
                mq: { // Management Quota
                    r1: { marks: parseNum(row[17]), rank: parseNum(row[18]) },
                    r2: { marks: parseNum(row[2]), rank: parseNum(row[3]) }
                },
                nri: { // NRI Quota
                    r1: { marks: parseNum(row[25]), rank: parseNum(row[26]) },
                    r2: { marks: parseNum(row[8]), rank: parseNum(row[9]) }
                },
                minority: {
                    tmq: { // Telugu Minority ?
                        r1: { marks: parseNum(row[23]), rank: parseNum(row[24]) },
                        r2: { marks: parseNum(row[4]), rank: parseNum(row[5]) }
                    },
                    mmq: { // Malayalam Minority ?
                        r1: { marks: parseNum(row[21]), rank: parseNum(row[22]) },
                        r2: { marks: parseNum(row[6]), rank: parseNum(row[7]) }
                    },
                    cmq: { // Christian Minority ?
                        r1: { marks: parseNum(row[19]), rank: parseNum(row[20]) },
                        r2: { marks: parseNum(row[10]), rank: parseNum(row[11]) }
                    }
                }
            };
        }).filter(item => item !== null);

        console.log(`✅ [TN Private] Loaded ${tnData.length} colleges.`);

    } catch (e) {
        console.error("❌ [TN Private] Error loading data:", e);
    }
};

// Load on startup
loadData();

/**
 * GET /api/tamilnadu/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: tnData.length,
            data: tnData
        });
    } catch (e) {
        console.error("Error in /api/tamilnadu/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
