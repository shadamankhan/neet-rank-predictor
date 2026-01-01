const fs = require('fs');
const path = require('path');
console.log("Starting test...");
const filePath = path.join(__dirname, 'backend', 'data', 'quizzes', 'SOLUTIONS 1.json');
try {
    const data = fs.readFileSync(filePath, 'utf8');
    console.log("Read bytes:", data.length);
} catch (e) {
    console.error("Error:", e.message);
}
