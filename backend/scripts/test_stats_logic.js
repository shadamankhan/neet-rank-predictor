const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const DATA_PATH = path.join(__dirname, '../../data/2020to2025total.csv');
console.log(`Checking path: ${DATA_PATH}`);

if (!fs.existsSync(DATA_PATH)) {
    console.error("File NOT found!");
    process.exit(1);
}

const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
// Mocking the parse logic from statsRoutes.js
try {
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    console.log(`Parsed ${records.length} records.`);
    console.log("First record:", records[0]); // Check keys
} catch (e) {
    console.error("Parse error:", e);
}
