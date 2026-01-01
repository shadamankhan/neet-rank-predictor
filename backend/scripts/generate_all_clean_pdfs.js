const fs = require('fs');
const path = require('path');
const { generatePdf } = require('./generate_clean_pdf');

const DATA_DIR_BASE = path.join(__dirname, '../../data');
const SUB_DIR = process.argv[2] || 'chemistryPYQ';
const DATA_DIR = path.join(DATA_DIR_BASE, SUB_DIR);

async function generateAll() {
    if (!fs.existsSync(DATA_DIR)) {
        console.error("Data dir not found");
        return;
    }

    // Find all _parsed.json files
    const files = fs.readdirSync(DATA_DIR);
    const splitFiles = files.filter(f => f.endsWith('_parsed.json'));

    console.log(`Found ${splitFiles.length} parsed JSONs to generate PDFs for.`);

    for (const jsonFile of splitFiles) {
        // Filename is <Chapter>_parsed.json
        // We need <Chapter>
        const chapterName = jsonFile.replace('_parsed.json', '');

        const outputFile = path.join(DATA_DIR, `${chapterName}_New_Clean.pdf`);
        if (fs.existsSync(outputFile)) {
            console.log(`Skipping PDF gen for ${chapterName} (PDF exists)`);
            continue;
        }

        try {
            console.log(`Generating PDF for chapter: ${chapterName} in ${SUB_DIR}`);
            await generatePdf(chapterName, SUB_DIR);
        } catch (err) {
            console.error(`Failed to generate PDF for ${chapterName}:`, err);
        }
    }
}

generateAll();
