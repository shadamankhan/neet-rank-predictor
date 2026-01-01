const fs = require('fs');
const path = require('path');

// Adjust path as needed. Assuming this file is in backend/src/utils/
const CSV_PATH = path.join(__dirname, '../../../data/marksvsrank2021to2025.csv');

let dataCache = null;

function parseRankString(str) {
    if (!str || str === '-') return null;

    // Remove "Rank " prefix if exists, although dataset seems to just have numbers/ranges
    let clean = str.replace(/["']/g, '').trim();

    // Handle "~"
    const isApprox = clean.includes('~');
    clean = clean.replace(/~/g, '').trim();

    // Handle " to " range
    if (clean.includes(' to ')) {
        const parts = clean.split(' to ').map(s => parseInt(s.replace(/,/g, ''), 10));
        const low = parts[0];
        const high = parts[1];
        return {
            text: str,
            min: low,
            max: high,
            avg: Math.round((low + high) / 2)
        };
    }

    // Handle simple number with commas
    const num = parseInt(clean.replace(/,/g, ''), 10);
    if (!isNaN(num)) {
        return {
            text: str,
            min: num,
            max: num,
            avg: num
        };
    }

    return { text: str, avg: null };
}

function loadData() {
    if (dataCache) return dataCache;

    try {
        const content = fs.readFileSync(CSV_PATH, 'utf8');
        const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');

        // Header: marks,2025,2024,2023,2022,2021...
        // We expect the first line to be header.
        const header = lines[0].split(',').map(c => c.trim());

        // Parse rows
        const parsedRows = [];

        for (let i = 1; i < lines.length; i++) {
            // Handle quoted CSV lines if necessary, but simple split might work if no commas inside quotes.
            // The file has "1 to 17", so simple split by comma WILL FAIL on "1,234".
            // Use a regex for CSV splitting
            const row = parseCSVLine(lines[i]);
            if (row.length < 2) continue;

            const marks = parseInt(row[0], 10);
            if (isNaN(marks)) continue; // Skip bad rows

            // Map columns
            // 0: Marks, 1: 2025, 2: 2024, 3: 2023, 4: 2022, 5: 2021
            parsedRows.push({
                marks,
                y2025: parseRankString(row[1]),
                y2024: parseRankString(row[2]),
                y2023: parseRankString(row[3]),
                y2022: parseRankString(row[4]),
                y2021: parseRankString(row[5]),
            });
        }

        // Sort by marks desc just in case
        dataCache = parsedRows.sort((a, b) => b.marks - a.marks);
        return dataCache;
    } catch (err) {
        console.error("Failed to load prediction CSV:", err);
        return [];
    }
}

// Simple regex based CSV splitter that handles quoted fields with commas
function parseCSVLine(text) {
    const re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;

    // A simplified approach since we know the structure:
    // Split by comma, but rejoin if inside quotes
    const matches = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            matches.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    matches.push(current.trim());
    return matches;
}

function getPrediction(score) {
    const data = loadData();
    if (!data || data.length === 0) return null;

    // Find exact match or bracket
    // data is sorted descending by marks (720 -> 0)

    // 1. Exact match
    const exact = data.find(d => d.marks === score);
    if (exact) return exact;

    // 2. Bracket
    // Find first row with marks < score (lower bound of rows, but higher rank number ?)
    // Actually, if we have 600 and 590, and score is 595.
    // 600 is index i, 590 is index i+1.
    // We want to interpolate between i and i+1.

    for (let i = 0; i < data.length - 1; i++) {
        if (data[i].marks > score && data[i + 1].marks < score) {
            const upper = data[i]; // Higher marks, lower rank
            const lower = data[i + 1]; // Lower marks, higher rank

            // Linear Interpolation for 2024 (most reliable)
            // If we don't have 2024 data for one of them, fall back to 2023.

            const p = (score - lower.marks) / (upper.marks - lower.marks); // Position 0..1

            return {
                marks: score,
                interpolated: true,
                y2025: interpolateYear(upper.y2025, lower.y2025, p),
                y2024: interpolateYear(upper.y2024, lower.y2024, p),
                y2023: interpolateYear(upper.y2023, lower.y2023, p),
                y2022: interpolateYear(upper.y2022, lower.y2022, p),
                y2021: interpolateYear(upper.y2021, lower.y2021, p),
            };
        }
    }

    // If score > max marks (720), return top
    if (score >= data[0].marks) return data[0];

    // If score < min marks, return bottom
    return data[data.length - 1];
}

function interpolateYear(upperObj, lowerObj, p) {
    if (!upperObj || !lowerObj || !upperObj.avg || !lowerObj.avg) {
        // Return non-interpolated fallback (simpler) or null
        return upperObj || lowerObj || null;
    }

    // Rank logic: Higher marks = Lower rank number.
    // upper.avg is smaller (e.g. 1000), lower.avg is larger (e.g. 2000).
    // result = lower.avg - p * (lower.avg - upper.avg)
    // p=0 -> lower.avg (score = lower.marks)
    // p=1 -> upper.avg (score = upper.marks)

    const val = Math.round(lowerObj.avg - p * (lowerObj.avg - upperObj.avg));
    return {
        text: `~${val.toLocaleString()}`,
        avg: val,
        min: val,
        max: val
    };
}

module.exports = {
    getPrediction
};
