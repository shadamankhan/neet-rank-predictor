const fs = require('fs');
const path = require('path');

try {
    const { v4: uuidv4 } = require('uuid');
    console.log("UUID v4 Test:", uuidv4());
} catch (e) {
    console.error("UUID Import Error:", e.message);
}

const TESTS_FILE = path.join(__dirname, 'data/test_series_db.json');
console.log("Target DB Path:", TESTS_FILE);

try {
    const dir = path.dirname(TESTS_FILE);
    if (!fs.existsSync(dir)) {
        console.log("Directory does not exist:", dir);
    } else {
        console.log("Directory exists.");
    }

    if (!fs.existsSync(TESTS_FILE)) {
        console.log("Creating new DB file...");
        fs.writeFileSync(TESTS_FILE, JSON.stringify({ tests: [], questions: [] }, null, 2));
    } else {
        console.log("Reading existing DB file...");
        const data = fs.readFileSync(TESTS_FILE, 'utf8');
        JSON.parse(data);
        console.log("DB File valid.");
    }
} catch (e) {
    console.error("File Operation Error:", e);
}
