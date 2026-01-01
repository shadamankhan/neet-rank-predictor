const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const firebaseAdmin = require('../../firebaseAdmin');
const admin = firebaseAdmin.admin;
const firestore = admin ? admin.firestore() : null;

const { parseUP, parseKerala, parseTN } = require('../utils/stateParsers');

// Load data into memory on startup
let mccRoundsData = [];
let collegesMasterData = {};

const loadData = () => {
    try {
        const mccPath = path.join(__dirname, '../../../data/mcc_rounds_2024.csv');
        const mccNewPath = path.join(__dirname, '../../../data/mcc2024round1rankcuttoff.csv');
        const collegesPath = path.join(__dirname, '../../../data/colleges_master.csv');

        // State Paths
        const upPath = path.join(__dirname, '../../../data/utterpardashprivate2025.csv');
        const keralaPath = path.join(__dirname, '../../../data/keralaprivate2025r1r2.csv');
        const tnPath = path.join(__dirname, '../../../data/tamilnaduPRIVATER1r22025.csv');

        // Load New MCC 2024 Data (Primary)
        if (fs.existsSync(mccNewPath)) {
            const fileContent = fs.readFileSync(mccNewPath, 'utf8');
            const parsedData = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: true
            });

            // Transform to internal format
            const transformedData = parsedData.map(record => ({
                college_name: record['Medical College'],
                state: record['State'],
                quota: record['Allotted Quota'],
                closing_rank: Number(record['Last Rank Allotted']) || 999999,
                category: 'GN', // Defaulting to General as per user context
                round: 1,
                year: 2024,
                type: record['Allotted Quota'].includes('Deemed') ? 'DEEMED' :
                    record['Allotted Quota'].includes('ESI') ? 'GOVERNMENT' :
                        record['Allotted Quota'].includes('All India') ? 'GOVERNMENT' : 'GOVERNMENT'
            }));

            mccRoundsData = [...mccRoundsData, ...transformedData];
            console.log(`✅ [CollegeFinder] Loaded ${transformedData.length} records from mcc2024round1rankcuttoff.csv`);
        }

        // --- Load State Data ---
        const upData = parseUP(upPath);
        if (upData.length > 0) {
            mccRoundsData = [...mccRoundsData, ...upData];
            console.log(`✅ [CollegeFinder] Loaded ${upData.length} UP Private colleges.`);
        }

        const keralaData = parseKerala(keralaPath);
        if (keralaData.length > 0) {
            mccRoundsData = [...mccRoundsData, ...keralaData];
            console.log(`✅ [CollegeFinder] Loaded ${keralaData.length} Kerala Private colleges.`);
        }

        const tnData = parseTN(tnPath);
        if (tnData.length > 0) {
            mccRoundsData = [...mccRoundsData, ...tnData];
            console.log(`✅ [CollegeFinder] Loaded ${tnData.length} TN Private colleges.`);
        }

        // Load Legacy MCC Rounds (if needed/exists)
        if (fs.existsSync(mccPath)) {
            const fileContent = fs.readFileSync(mccPath, 'utf8');
            const legacyData = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: true
            });
            // mccRoundsData = [...mccRoundsData, ...legacyData]; // Uncomment if we want to merge legacy
            console.log(`ℹ️ [CollegeFinder] Legacy data found but not merged to prevent duplicates (Check logic if needed).`);
        } else {
            // console.warn(`⚠️ [CollegeFinder] mcc_rounds_2024.csv not found at ${mccPath}`);
        }

        // Load Colleges Master (Still useful for legacy or enriching other datasets)
        if (fs.existsSync(collegesPath)) {
            const fileContent = fs.readFileSync(collegesPath, 'utf8');
            const collegesArray = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: true
            });

            // Index by college_id for faster lookup
            collegesArray.forEach(college => {
                collegesMasterData[college.college_id] = college;
            });
            console.log(`✅ [CollegeFinder] Loaded ${Object.keys(collegesMasterData).length} colleges from colleges_master.csv`);
        } else {
            console.warn(`⚠️ [CollegeFinder] colleges_master.csv not found at ${collegesPath}`);
        }

    } catch (error) {
        console.error("❌ [CollegeFinder] Error loading data:", error);
    }
};

// Initial load
loadData();

/**
 * GET /api/colleges/filters
 * Returns unique States and Quotas found in the loaded data
 */
router.get('/filters', (req, res) => {
    try {
        const states = new Set();
        const quotas = new Set();

        mccRoundsData.forEach(record => {
            if (record.state) states.add(record.state);
            if (record.quota) quotas.add(record.quota);
        });

        // Also check collegesMasterData for states if needed, but mccRoundsData is primary for search
        // (Optional: merge with master data states if they differ significantly)

        res.json({
            ok: true,
            states: Array.from(states).sort(),
            quotas: Array.from(quotas).sort()
        });
    } catch (error) {
        console.error("Error in /filters:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

/**
 * POST /api/colleges/find
 * Body: { rank: Number, category: String, state: String (optional), quota: String (optional), idToken: String (optional) }
 */
router.post('/find', async (req, res) => {
    try {
        const { rank, category, state, idToken } = req.body;

        if (!rank) {
            return res.status(400).json({ ok: false, message: "Rank is required" });
        }

        const { quota } = req.body;

        // 1. Filter MCC Data
        // Logic: Valid if closing_rank >= user_rank. 
        // Also filter by category if provided.
        let results = mccRoundsData.filter(record => {
            // Basic rank check
            if (record.closing_rank < rank) return false;

            // Category check (if provided). 
            if (category && record.category && record.category.toUpperCase() !== category.toUpperCase()) {
                return false;
            }

            // Quota check (if provided)
            if (quota && record.quota && record.quota !== quota) {
                return false;
            }

            return true;
        });

        // 2. Enrich with College Master Data
        // And optionally filter by state
        const enrichedResults = [];

        results.forEach(record => {
            const collegeInfo = collegesMasterData[record.college_id];

            let enrichedRecord = null;

            if (collegeInfo) {
                // State filter
                if (state && collegeInfo.state && collegeInfo.state.toUpperCase() !== state.toUpperCase()) {
                    return;
                }

                enrichedRecord = {
                    ...record,
                    ...collegeInfo // Merges college_name, state, type, etc.
                };
            } else {
                // If no master data, check if record itself has state if filter is active
                if (!state || (record.state && record.state.toUpperCase() === state.toUpperCase())) {
                    enrichedRecord = { ...record };
                }
            }

            if (enrichedRecord) {
                // --- FEE SYNTHESIS LOGIC ---
                // Estimate fee if not present based on Type/Quota
                if (!enrichedRecord.fee) {
                    const type = (enrichedRecord.type || "").toUpperCase();
                    const quota = (enrichedRecord.quota || "").toUpperCase();

                    if (type === 'GOVERNMENT' || type === 'CENTRAL' || quota === 'AIQ') {
                        enrichedRecord.fee = 50000; // ~50k/year avg for govt
                        enrichedRecord.feeDisplay = "₹10k - ₹1L";
                    } else if (type === 'PRIVATE' || quota.includes('MNG') || quota === 'MNQ') {
                        enrichedRecord.fee = 1500000; // ~15L/year
                        enrichedRecord.feeDisplay = "₹12L - ₹18L";
                    } else if (type === 'DEEMED' || quota === 'DEEMED') {
                        enrichedRecord.fee = 2200000; // ~22L/year
                        enrichedRecord.feeDisplay = "₹18L - ₹25L";
                    } else {
                        // Fallback
                        enrichedRecord.fee = 1000000;
                        enrichedRecord.feeDisplay = "Variable";
                    }
                }
                enrichedResults.push(enrichedRecord);
            }
        });

        // 3. Sort results
        enrichedResults.sort((a, b) => a.closing_rank - b.closing_rank);

        // Limit results if too many?
        const limitedResults = enrichedResults.slice(0, 100);

        // --- Save to History (Async, don't block response) ---
        if (idToken && firestore) {
            (async () => {
                try {
                    const decoded = await admin.auth().verifyIdToken(idToken);
                    const uid = decoded.uid;
                    await firestore.collection('predictions').add({
                        userId: uid,
                        email: decoded.email || null,
                        type: 'college_search',
                        rank: rank,
                        category: category,
                        state: state || null,
                        resultCount: enrichedResults.length,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } catch (err) {
                    console.error("Failed to save history:", err.message);
                }
            })();
        }

        res.json({
            ok: true,
            count: enrichedResults.length,
            results: limitedResults
        });

    } catch (error) {
        console.error("Error in /find:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

/**
 * GET /api/colleges/stats
 * Returns aggregated stats for Probability Meter
 */
router.get('/stats', async (req, res) => {
    try {
        // We need max closing ranks for different categories/types to realistically calculate "probability"
        // Bucket: Govt AIQ, Govt State (approx), Private, Deemed

        let stats = {
            govtAIQ: 0,
            govtState: 0,
            private: 0,
            deemed: 0,
            bds: 0
        };

        // Scan all MCC data
        // This is a naive scan. For production, cache this or pre-calculate.
        mccRoundsData.forEach(r => {
            const rank = Number(r.closing_rank) || 0;
            const quota = (r.quota || "").toUpperCase();
            const cat = (r.category || "").toUpperCase();

            // Heuristics based on MCC data conventions
            const isBDS = r.course && r.course.includes('BDS'); // Assuming course field exists or implicit
            // Note: mcc_rounds_2024.csv cols: round,college_id,college_name,quota,category,closing_rank,closing_score,year
            // It doesn't seem to have Course column in the snippet we saw. Assuming MBBS is default/majority if missing.

            // If we can't distinguish BDS, we might need to assume High Ranks are BDS or just ignore separate BDS stat for now unless we have data
            // Let's rely on quota/type

            if (quota === 'AIQ' && (cat === 'GN' || cat === 'UR' || cat === 'OBC')) {
                if (rank > stats.govtAIQ) stats.govtAIQ = rank;
            }
            // "Govt State" is hard to distinguish just from MCC data which is mostly AIQ/Deemed. 
            // We'll use a heuristic multiplier or just map what we have.
            // Let's treat AIQ as baseline Generic Govt.

            if (quota === 'DEEMED') {
                if (rank > stats.deemed) stats.deemed = rank;
            }
        });

        // Manual overrides/corrections if data is sparse (e.g. only round 1 loaded)
        // A typical year:
        // Govt AIQ ~ 25k
        // Govt State ~ 50k (varies)
        // Prvt ~ 1L-5L (varies widely)
        // Deemed ~ 10L
        // BDS ~ 10L+

        // If data is insufficient, provide reasonable defaults
        if (stats.govtAIQ < 10000) stats.govtAIQ = 25000;
        stats.govtState = Math.floor(stats.govtAIQ * 1.5); // Heuristic
        if (stats.deemed < 200000) stats.deemed = 1000000;
        stats.private = 800000; // Heuristic for private colleges
        stats.bds = 1200000;

        res.json({ ok: true, stats });

    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

module.exports = router;
