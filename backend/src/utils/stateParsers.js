const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Generic helper to clean currency/number strings
const cleanNumber = (str) => {
    if (!str) return 0;
    // Remove commas, currency symbols, generic text
    const cleaned = str.toString().replace(/[₹,Rs\. ]/g, '');
    return Number(cleaned) || 0;
};

// --- UTTAR PRADESH PARSER ---
const parseUP = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        return records.map(r => {
            // Priority: R2 Rank -> R1 Rank -> default
            let rank = cleanNumber(r['Round2 Rank 2025']);
            if (!rank) rank = cleanNumber(r['Round1 Rank 2025']);
            if (!rank) return null; // Skip if no rank data

            const fee = cleanNumber(r['Budget']); // "Budget" usually implies total package or annual * 4.5, but user wants annual filter.
            // UP Private avg is 12L-16L/yr. Budget col in CSV e.g "₹75,67,061" likely full package.
            // Heuristic: If > 40L, assume full package and divide by 4.5
            let annualFee = fee;
            if (fee > 4000000) annualFee = Math.round(fee / 4.5);

            return {
                college_name: r['College Name'],
                state: 'Uttar Pradesh',
                quota: 'Private',
                category: 'GN', // UP Private is open
                closing_rank: rank,
                fee: annualFee,
                feeDisplay: `₹${(annualFee / 100000).toFixed(1)}L/yr`,
                type: 'PRIVATE',
                year: 2025
            };
        }).filter(Boolean);
    } catch (e) {
        console.error("Error parsing UP:", e.message);
        return [];
    }
};

// --- KERALA PARSER ---
const parseKerala = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        return records.map(r => {
            // Kerala "AI Rank 2025 Round 1" or Round 2
            let rank = cleanNumber(r['AI Rank 2025 Round 2']);
            if (!rank) rank = cleanNumber(r['AI Rank 2025 Round 1 ']);
            if (!rank) return null;

            const fee = cleanNumber(r['Tuition Fees/Year']);

            return {
                college_name: r['Medical College Name'],
                state: 'Kerala',
                quota: 'Private',
                category: 'GN', // Open for AI
                closing_rank: rank,
                fee: fee,
                feeDisplay: `₹${(fee / 100000).toFixed(1)}L/yr`,
                type: 'PRIVATE',
                year: 2025
            };
        }).filter(Boolean);
    } catch (e) {
        console.error("Error parsing Kerala:", e.message);
        return [];
    }
};

// --- TAMIL NADU PARSER ---
const parseTN = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Loop through multiple categories in same row if needed (MQ, etc)
        // CSV has "MQ R2 RANK", "GM FEES", "MQ FEES"
        const results = [];

        records.forEach(r => {
            const college = r['COLLEGE NAME'];

            // 1. Management Quota (MQ) - General Management
            const mqRank = cleanNumber(r['MQ R2 RANK']) || cleanNumber(r['MQ R1 RANK']);
            const mqFee = cleanNumber(r['MQ FEES']) || cleanNumber(r['GM FEES']) || 1350000;

            if (mqRank) {
                results.push({
                    college_name: college,
                    state: 'Tamil Nadu',
                    quota: 'Management',
                    category: 'GN',
                    closing_rank: mqRank,
                    fee: mqFee,
                    feeDisplay: `₹${(mqFee / 100000).toFixed(1)}L/yr`,
                    type: 'PRIVATE',
                    year: 2025
                });
            }

            // 2. NRI Quota (optional, usually high fee)
            const nriRank = cleanNumber(r['NRI R2 RANK']) || cleanNumber(r['NRI R1 RANK']);
            const nriFee = cleanNumber(r['NRI FEES']) || 2500000;
            if (nriRank) {
                results.push({
                    college_name: college,
                    state: 'Tamil Nadu',
                    quota: 'NRI',
                    category: 'NRI', // Use NRI as category for clearer filter
                    closing_rank: nriRank,
                    fee: nriFee,
                    feeDisplay: `₹${(nriFee / 100000).toFixed(1)}L/yr`,
                    type: 'PRIVATE',
                    year: 2025
                });
            }
        });

        return results;
    } catch (e) {
        console.error("Error parsing TN:", e.message);
        return [];
    }
};

module.exports = {
    parseUP,
    parseKerala,
    parseTN
};
