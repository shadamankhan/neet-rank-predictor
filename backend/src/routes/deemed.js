const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let mergedDeemedData = [];
let availableStates = new Set();

const CSV_FILES = [
    'deemedall20242025r1r2.csv',
    'deemedchennaiandpuducherry20242025.csv',
    'deemedkarnataka20242025.csv',
    'deemedmaharashtra20242025.csv',
    'deemedother20242025.csv'
];

/**
 * Helper to clean rank/score strings (e.g. "1,234" -> 1234, "xx" -> null)
 */
const parseNum = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return val;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === 'xx' || cleaned === 'na') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Helper to clean currency strings (e.g. "2,500,000" -> 2500000)
 */
const parseFee = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').replace(/₹/g, '').replace(/ /g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '–' || cleaned.toLowerCase() === 'xx') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadDeemedData = () => {
    try {
        const collegeMap = new Map();

        CSV_FILES.forEach(fileName => {
            const filePath = path.join(__dirname, '../../data', fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ [Deemed] File not found: ${fileName}`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_quotes: true
            });

            records.forEach(row => {
                // Normalize College Name Key
                const rawName = row['College Name'] || row['College Name_1']; // Handle slight variations if any
                if (!rawName) return;

                const nameKey = rawName.toLowerCase().trim();

                if (!collegeMap.has(nameKey)) {
                    // Initialize if new
                    collegeMap.set(nameKey, {
                        collegeName: rawName, // Keep original casing of first occurrence
                        state: row['State'] || row['state'] || null,
                        estd: row['Estd'] || null,
                        seats: parseNum(row['Seats']),
                        years: row['Years'], // Keep as string e.g. "4.5"
                        fee2024: parseFee(row['Yearly Fee 2024 (₹)']),
                        fee2025: parseFee(row['Yearly Fee 2025 (₹)']),
                        increasedFee: parseFee(row['Increased Fees (₹)']),
                        cutoffs: {
                            2024: { r1: {}, r2: {}, r3: {}, stray: {} },
                            2025: { r1: {}, r2: {}, r3: {}, stray: {} }
                        }
                    });
                }

                const entry = collegeMap.get(nameKey);

                // Merge Basic Info (Prioritize non-null)
                if (!entry.state && (row['State'] || row['state'])) entry.state = row['State'] || row['state'];
                if (!entry.estd && row['Estd']) entry.estd = row['Estd'];
                if (!entry.seats && row['Seats']) entry.seats = parseNum(row['Seats']);
                if (!entry.fee2024 && row['Yearly Fee 2024 (₹)']) entry.fee2024 = parseFee(row['Yearly Fee 2024 (₹)']);
                if (!entry.fee2025 && row['Yearly Fee 2025 (₹)']) entry.fee2025 = parseFee(row['Yearly Fee 2025 (₹)']);
                if (!entry.increasedFee && row['Increased Fees (₹)']) entry.increasedFee = parseFee(row['Increased Fees (₹)']);

                // Merge Cutoff Data (2024)
                // Note: CSV headers vary slightly ("rank 2024 R1", "score 2024 R1", etc.)
                // We blindly check for all known variants found in schemas

                // 2024 R1
                if (row['rank 2024 R1']) entry.cutoffs[2024].r1.rank = parseNum(row['rank 2024 R1']);
                if (row['score 2024 R1']) entry.cutoffs[2024].r1.score = parseNum(row['score 2024 R1']);

                // 2024 R2
                if (row['rank 2024 R2']) entry.cutoffs[2024].r2.rank = parseNum(row['rank 2024 R2']);
                if (row['score 2024 R2']) entry.cutoffs[2024].r2.score = parseNum(row['score 2024 R2']);

                // 2024 R3
                if (row['rank 2024 R3']) entry.cutoffs[2024].r3.rank = parseNum(row['rank 2024 R3']);
                if (row['score 2024 R3']) entry.cutoffs[2024].r3.score = parseNum(row['score 2024 R3']);

                // 2024 Stray
                if (row['rank 2024 Stray']) entry.cutoffs[2024].stray.rank = parseNum(row['rank 2024 Stray']);
                if (row['score 2024 Stray']) entry.cutoffs[2024].stray.score = parseNum(row['score 2024 Stray']);

                // 2025 R1
                if (row['rank 2025 R1']) entry.cutoffs[2025].r1.rank = parseNum(row['rank 2025 R1']);
                if (row['score 2025 R1']) entry.cutoffs[2025].r1.score = parseNum(row['score 2025 R1']);

                // 2025 R2
                if (row['rank 2025 R2']) entry.cutoffs[2025].r2.rank = parseNum(row['rank 2025 R2']);
                if (row['score 2025 R2']) entry.cutoffs[2025].r2.score = parseNum(row['score 2025 R2']);

                // 2025 R3
                if (row['rank 2025 R3']) entry.cutoffs[2025].r3.rank = parseNum(row['rank 2025 R3']);
                if (row['score 2025 R3']) entry.cutoffs[2025].r3.score = parseNum(row['score 2025 R3']);
            });
        });

        // Convert Map to Array
        mergedDeemedData = Array.from(collegeMap.values());

        // Extract States
        mergedDeemedData.forEach(c => {
            if (c.state) {
                // Normalize state names (e.g. "Tamil Nadu" vs "Tamil Nadu ")
                c.state = c.state.trim();
                availableStates.add(c.state);
            }
        });

        console.log(`✅ [Deemed] Loaded and merged ${mergedDeemedData.length} colleges from ${CSV_FILES.length} files.`);

    } catch (e) {
        console.error("❌ [Deemed] Error loading data:", e);
    }
};

// Load on startup
loadDeemedData();

/**
 * GET /api/deemed/all
 * Optional Query Params: state, maxFee
 */
router.get('/all', (req, res) => {
    try {
        let results = mergedDeemedData;
        const { state, maxFee } = req.query;

        if (state) {
            results = results.filter(c => c.state && c.state.toLowerCase() === state.toLowerCase());
        }

        if (maxFee) {
            const feeLimit = Number(maxFee);
            results = results.filter(c => (c.fee2025 || c.fee2024 || 999999999) <= feeLimit);
        }

        res.json({
            ok: true,
            count: results.length,
            states: Array.from(availableStates).sort(),
            data: results
        });
    } catch (e) {
        console.error("Error in /api/deemed/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
