const fs = require('fs');
const path = require('path');

console.log("Script execution started...");

// Configuration
const SOURCE_DIRS = [
    path.join(__dirname, '../../data/physisPYQ'),
    path.join(__dirname, '../../data/chemistryPYQ')
];
const OUTPUT_DIR = path.join(__dirname, '../data/quizzes');

console.log("Output Directory:", OUTPUT_DIR);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Re-using the robust logic from debug_physics_pdf.js
async function extractStructuredText(filePath, pdfjs) {
    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer);
    const loadingTask = pdfjs.getDocument(uint8Array);
    const doc = await loadingTask.promise;

    let finalLines = [];

    // Process ALL pages for the real deal
    const limitPages = doc.numPages; // No limit
    // console.log(`  Processing ${limitPages} pages...`);

    for (let i = 1; i <= limitPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        const view = page.getViewport({ scale: 1.0 });
        const midX = view.width / 2;

        const items = textContent.items.map(item => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            hasEOL: item.hasEOL,
            page: i
        }));

        const leftCol = items.filter(item => item.x < midX);
        const rightCol = items.filter(item => item.x >= midX);

        const processColumn = (colItems) => {
            if (colItems.length === 0) return [];
            const Y_TOLERANCE = 4;
            colItems.sort((a, b) => {
                if (Math.abs(a.y - b.y) > Y_TOLERANCE) return b.y - a.y;
                return a.x - b.x;
            });

            let lines = [];
            let currentLine = [];
            let currentY = colItems[0].y;

            for (let item of colItems) {
                if (Math.abs(item.y - currentY) > Y_TOLERANCE) {
                    if (currentLine.length > 0) {
                        lines.push(currentLine.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
                    }
                    currentLine = [item];
                    currentY = item.y;
                } else {
                    currentLine.push(item);
                }
            }
            if (currentLine.length > 0) {
                lines.push(currentLine.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
            }
            return lines;
        };

        const leftLines = processColumn(leftCol);
        const rightLines = processColumn(rightCol);
        finalLines = finalLines.concat(leftLines).concat(rightLines);
    }

    return finalLines;
}

function parseMCQs(lines) {
    const questions = [];
    let currentQuestion = null;
    let captureMode = 'NONE';
    const qStartRegex = /^(\d+)[\.\)]\s/;
    const optionRegex = /^(\([a-zA-Z0-9]+\)|[A-D][\.\)])\s/;

    lines.forEach((text) => {
        if (!text) return;
        text = text.trim();

        const qMatch = text.match(qStartRegex);
        if (qMatch) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = {
                id: parseInt(qMatch[1]),
                question: text.replace(qStartRegex, '').trim(),
                options: [],
                answer: null
            };
            captureMode = 'QUESTION';
            return;
        }

        if (currentQuestion) {
            const optMatch = text.match(optionRegex);
            if (optMatch || captureMode === 'OPTIONS') {
                captureMode = 'OPTIONS';
                if (optMatch) {
                    currentQuestion.options.push(text);
                } else {
                    if (currentQuestion.options.length > 0) {
                        currentQuestion.options[currentQuestion.options.length - 1] += " " + text;
                    } else {
                        currentQuestion.question += " " + text;
                    }
                }
                return;
            }
            if (captureMode === 'QUESTION') {
                currentQuestion.question += " " + text;
            }
        }
    });

    if (currentQuestion) questions.push(currentQuestion);
    return questions.filter(q => q.options.length > 0);
}

// MAIN
(async () => {
    try {
        console.log("Importing PDFJS...");
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        console.log("PDFJS Imported.");

        let totalFiles = 0;
        let totalQuestions = 0;

        for (const dir of SOURCE_DIRS) {
            console.log(`Checking Directory: ${dir}`);
            if (!fs.existsSync(dir)) {
                console.log(`Skipping missing directory: ${dir}`);
                continue;
            }

            console.log(`Reading Directory...`);
            const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf'));
            console.log(`Found ${files.length} PDF files.`);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const baseName = path.basename(file, '.pdf');
                const outPath = path.join(OUTPUT_DIR, `${baseName}.json`);

                // Check if already exists to save time? No, overwrite.

                console.log(`  Processing: ${file}...`);
                try {
                    const lines = await extractStructuredText(filePath, pdfjs);
                    const mcqs = parseMCQs(lines);

                    if (mcqs.length > 0) {
                        fs.writeFileSync(outPath, JSON.stringify(mcqs, null, 2));
                        console.log(`    -> Generated ${baseName}.json (${mcqs.length} Qs)`);
                        totalFiles++;
                        totalQuestions += mcqs.length;
                    } else {
                        console.log(`    -> No questions parsed.`);
                    }
                } catch (e) {
                    console.error(`    -> ERROR: ${e.message}`);
                }
            }
        }

        console.log("------------------------------------------------");
        console.log(`Batch Processing Complete.`);
        console.log(`Processed ${totalFiles} files.`);
        console.log(`Generated ${totalQuestions} total questions.`);

    } catch (err) {
        console.error("Fatal Error:", err);
    }
})();
