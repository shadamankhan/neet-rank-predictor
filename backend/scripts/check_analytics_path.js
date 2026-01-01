const path = require('path');
const fs = require('fs');

const DATA_PATH_TRENDS = path.join(__dirname, '../../data/Neet2016to2025rankvsmarks50000rank.csv');

console.log("Checking path:", DATA_PATH_TRENDS);

if (fs.existsSync(DATA_PATH_TRENDS)) {
    console.log("File FOUND.");
} else {
    console.log("File NOT FOUND.");
}
