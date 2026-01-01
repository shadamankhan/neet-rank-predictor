const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data/chemistryPYQ');

if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    let count = 0;
    files.forEach(file => {
        if (file.endsWith('_parsed.json')) {
            fs.unlinkSync(path.join(DATA_DIR, file));
            count++;
        }
    });
    console.log(`Deleted ${count} parsed JSON files in chemistryPYQ.`);
} else {
    console.log('Directory not found:', DATA_DIR);
}
