const fs = require('fs');
const path = require('path');

// Mock inputs
const score = 700;
const year = 2025;
const category = 'GEN';
const quota = 'AI';

function loadDistribution(year, suffix = '') {
    const fileName = `distribution_${year}${suffix}.json`;
    // Mimic the path logic in predict.js (assuming this script is in backend/scripts, so ../data)
    // predict.js is in backend/src/routes, so it uses ../../data
    // We will assume running from backend root? No, typical is node scripts/debug...

    // Let's hardcode relative to CWD to be safe or use absolute check
    // If we run `node scripts/debug_prediction_local.js` from `backend/`
    // The data is in `data/`

    const filePath = path.join(process.cwd(), 'data', fileName);
    console.log('Loading file:', filePath);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Distribution file missing: ${filePath}`);
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let buckets = null;
    let totalCandidates = 0;

    if (Array.isArray(raw)) {
        buckets = raw;
        totalCandidates = raw.reduce((sum, b) => sum + b.count, 0);
    } else if (raw && Array.isArray(raw.buckets)) {
        buckets = raw.buckets;
        totalCandidates = raw.total_candidates || buckets.reduce((sum, b) => sum + b.count, 0);
    } else {
        throw new Error("Invalid distribution JSON format");
    }

    console.log(`Loaded ${buckets.length} buckets, total ${totalCandidates}`);
    return { buckets, totalCandidates };
}

try {
    console.log(`Testing Predict Logic: Year=${year} Score=${score}`);

    // Logic from predict.js
    let suffix = '';
    if (category && category !== 'GEN' && category !== 'ALL') {
        suffix = `_${category.toUpperCase()}`;
    }

    const distData = loadDistribution(year, suffix);
    const { buckets, totalCandidates } = distData;

    const sorted = buckets.slice().sort((a, b) => b.score - a.score);

    let cumAbove = 0;
    for (const b of sorted) {
        if (score < b.score) {
            cumAbove += b.count;
        }
    }

    const rank = cumAbove + 1;
    const percentile = ((totalCandidates - rank) / totalCandidates) * 100;

    console.log('Result:', { rank, percentile });
    console.log('SUCCESS');

} catch (err) {
    console.error('ERROR:', err);
}
