const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes\\Coordination Compounds 1.json';
const outputPath = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes\\Coordination Compounds 1_fixed.json';

console.log('Starting script...');

try {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    console.log('Reading file...');
    let rawData = fs.readFileSync(filePath, 'utf8');
    console.log(`Read ${rawData.length} characters.`);

    console.log('Replacing concatenated arrays...');
    // Replace `][` sequences with `,`
    let fixedData = rawData.replace(/\]\s*\[/g, ',');
    fixedData = fixedData.trim();

    console.log('Parsing JSON...');
    let questions;
    try {
        questions = JSON.parse(fixedData);
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        // Try to print the area around the error if possible (simple slice)
        // console.log(fixedData.substring(0, 100));
        process.exit(1);
    }

    console.log(`Parsed ${questions.length} questions.`);

    console.log('Re-indexing...');
    questions = questions.map((q, index) => {
        q.id = index + 1;
        if (q.options) {
            q.options = q.options.map(opt => opt.trim());
        }
        return q;
    });

    console.log(`Writing to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 4));
    console.log('Success! Done.');

} catch (err) {
    console.error('Error processing file:', err);
}
