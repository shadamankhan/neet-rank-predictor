const fs = require('fs');
const path = require('path');

const quizDir = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes';
const totalSets = 25;
let currentId = 1;

console.log('Starting re-indexing of Physics quiz sets...');

for (let i = 1; i <= totalSets; i++) {
    const filename = `Physics set ${i}.json`;
    const filePath = path.join(quizDir, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`Skipping missing file: ${filename}`);
        continue;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let json = JSON.parse(content);

        if (!Array.isArray(json)) {
            console.log(`Skipping invalid file (not array): ${filename}`);
            continue;
        }

        const startId = currentId;
        json = json.map(q => {
            q.id = currentId++;
            return q;
        });
        const endId = currentId - 1;

        fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
        console.log(`Updated ${filename}: IDs ${startId} - ${endId}`);

    } catch (err) {
        console.error(`Error processing ${filename}: ${err.message}`);
    }
}

console.log('Re-indexing complete.');
