const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Data Cache
let apData = [];
const FILES = {
    b1_2024: 'AndhraPradeshManagementB1QuotaRound2Cutoff2024.csv',
    b1_2025: 'AndhraPradeshManagementB1QuotaRound2Cutoff2025.csv',
    b2_2024: 'AndhraPradeshManagementB2QuotaRound2Cutoff2024.csv',
    b2_2025: 'AndhraPradeshManagementB2QuotaRound2Cutoff2025.csv'
};

/**
 * Helper to clean rank/score strings
 */
const parseNum = (val) => {
    if (!val) return null;
    const cleaned = val.toString().replace(/,/g, '').trim().toLowerCase();
    if (cleaned === '' || cleaned === '-' || cleaned === '–' || cleaned === 'xx' || cleaned === 'nm') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

const loadFile = (filename) => {
    try {
        const filePath = path.join(__dirname, '../../../data', filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ [AP Private] File not found: ${filename}`);
            return [];
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    } catch (e) {
        console.error(`❌ [AP Private] Error loading ${filename}:`, e);
        return [];
    }
};

const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const loadData = () => {
    console.log("🔄 [AP Private] Loading and merging data...");

    const dataMap = new Map();

    // Helper to merge data into the map
    const mergeData = (key, records) => {
        records.forEach(row => {
            const rawName = row['College Name'];
            if (!rawName || rawName.includes('Total')) return; // Skip total rows

            const normalized = normalizeName(rawName);
            if (!dataMap.has(normalized)) {
                dataMap.set(normalized, {
                    collegeName: rawName, // Keep the first name encountered as display name
                    b1_2024: { r1: {}, r2: {} },
                    b1_2025: { r1: {}, r2: {} },
                    b2_2024: { r1: {}, r2: {} },
                    b2_2025: { r1: {}, r2: {} }
                });
            }

            const entry = dataMap.get(normalized);
            // 2024 files have Phase-I / Phase-II
            // 2025 files have Phase-1 / Phase-2

            // Normalize column access
            let r1Rank, r1Score, r2Rank, r2Score;

            if (row['Phase-I AIR']) { // 2024 style
                r1Rank = row['Phase-I AIR'];
                r1Score = row['Phase-I Marks'];
                r2Rank = row['Phase-II AIR'];
                r2Score = row['Phase-II Marks'];
            } else { // 2025 style
                r1Rank = row['Phase-1 AIR'];
                r1Score = row['Phase-1 Marks'];
                r2Rank = row['Phase-2 AIR'];
                r2Score = row['Phase-2 Marks'];
            }

            entry[key] = {
                r1: {
                    rank: parseNum(r1Rank),
                    score: parseNum(r1Score)
                },
                r2: {
                    rank: parseNum(r2Rank),
                    score: parseNum(r2Score)
                }
            };
        });
    };

    mergeData('b1_2024', loadFile(FILES.b1_2024));
    mergeData('b1_2025', loadFile(FILES.b1_2025));
    mergeData('b2_2024', loadFile(FILES.b2_2024));
    mergeData('b2_2025', loadFile(FILES.b2_2025));

    apData = Array.from(dataMap.values());
    console.log(`✅ [AP Private] Merged ${apData.length} colleges.`);
};

// Load on startup
loadData();

/**
 * GET /api/andhrapradesh/all
 */
router.get('/all', (req, res) => {
    try {
        res.json({
            ok: true,
            count: apData.length,
            data: apData
        });
    } catch (e) {
        console.error("Error in /api/andhrapradesh/all:", e);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

module.exports = router;
