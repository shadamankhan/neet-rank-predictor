const fs = require('fs');
const path = require('path');

const quizDir = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes';
const totalSets = 25;
let allPassed = true;

const logFile = path.join(quizDir, 'validation_log.txt');
fs.writeFileSync(logFile, 'Starting validation log...\n');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

log('Starting validation of Physics quiz sets...');

for (let i = 1; i <= totalSets; i++) {
    const filename = `Physics set ${i}.json`;
    const filePath = path.join(quizDir, filename);

    if (!fs.existsSync(filePath)) {
        log(`❌ [MISSING] ${filename}`);
        allPassed = false;
        continue;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.trim()) {
            log(`❌ [EMPTY] ${filename}`);
            allPassed = false;
            continue;
        }

        const json = JSON.parse(content);

        if (!Array.isArray(json)) {
            log(`❌ [INVALID TYPE] ${filename} is not an array`);
            allPassed = false;
            continue;
        }

        if (json.length === 0) {
            log(`⚠️ [ZERO QUESTIONS] ${filename} has 0 questions`);
        }

        // Check IDs
        const ids = json.map(q => q.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
            log(`❌ [DUPLICATE IDS] ${filename} has duplicate IDs: ${duplicates.join(', ')}`);
            allPassed = false;
        }

        // Check continuity (optional but good)
        // const expectedStart = (i - 1) * 50 + 1; // Assuming 50 per set
        // ...

        // Check basic structure of first item
        if (json.length > 0) {
            const first = json[0];
            if (!first.question || !first.options || !first.answer === undefined || !first.explanation) {
                log(`❌ [MALFORMED ITEM] ${filename} (first item missing keys)`);
                allPassed = false;
            }
        }

        log(`✅ [OK] ${filename}: ${json.length} questions (IDs ${ids[0]} - ${ids[ids.length - 1]})`);

    } catch (err) {
        log(`❌ [JSON ERROR] ${filename}: ${err.message}`);
        allPassed = false;
    }
}

if (allPassed) {
    log('\n🎉 All Physics sets validated successfully!');
} else {
    log('\n⚠️ Some files have issues. Please check the logs.');
}

