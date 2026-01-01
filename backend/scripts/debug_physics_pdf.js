const fs = require('fs');
const path = require('path');

async function extractStructuredText(filePath) {
    // Dynamic import for pdfjs-dist
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer);
    const loadingTask = pdfjs.getDocument(uint8Array);
    const doc = await loadingTask.promise;

    console.log(`Loaded PDF: ${path.basename(filePath)} (${doc.numPages} pages)`);

    let finalLines = [];

    // Extract items with coordinates from first 5 pages
    const limitPages = Math.min(doc.numPages, 5);
    for (let i = 1; i <= limitPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        // Basic Page Info
        // viewport can give us width/height but usually A4 is ~600x840
        // Let's assume 2-column split at X=300 approx if explicit width missing
        const view = page.getViewport({ scale: 1.0 });
        const midX = view.width / 2;

        const items = textContent.items.map(item => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            hasEOL: item.hasEOL,
            page: i
        }));

        // Split into Left and Right Columns
        const leftCol = items.filter(item => item.x < midX);
        const rightCol = items.filter(item => item.x >= midX);

        // Function to process a column of items into lines
        const processColumn = (colItems) => {
            if (colItems.length === 0) return [];

            // Sort by Y (Descending - Top to Bottom), then X
            const Y_TOLERANCE = 4; // Tighter tolerance
            colItems.sort((a, b) => {
                if (Math.abs(a.y - b.y) > Y_TOLERANCE) return b.y - a.y;
                return a.x - b.x;
            });

            let lines = [];
            let currentLine = [];
            let currentY = colItems[0].y;

            for (let item of colItems) {
                if (Math.abs(item.y - currentY) > Y_TOLERANCE) {
                    // Push previous line
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

        // Process Left then Right
        const leftLines = processColumn(leftCol);
        const rightLines = processColumn(rightCol);

        // Add to final list
        finalLines = finalLines.concat(leftLines).concat(rightLines);
    }

    return finalLines;
}

function parseMCQs(lines) {
    const questions = [];
    let currentQuestion = null;
    let captureMode = 'NONE'; // NONE, QUESTION, OPTIONS

    // Regex Patterns
    // Captures "1.", "1)", "25.", "25)" at start of line
    const qStartRegex = /^(\d+)[\.\)]\s/;

    // Captures option starts like "(a)", "(1)", "A.", "a)"
    // Avoids capturing "A" inside a sentence.
    const optionRegex = /^(\([a-zA-Z0-9]+\)|[A-D][\.\)])\s/;

    // Split combined options e.g., "(a) Option A (b) Option B"
    const splitOptionRegex = /(\([a-zA-Z0-9]+\)|[A-D][\.\)])/g;

    lines.forEach((text, index) => {
        if (!text) return;
        text = text.trim();

        // 1. Check for NEW Question
        const qMatch = text.match(qStartRegex);
        if (qMatch) {
            // Save previous
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            // Init new
            currentQuestion = {
                id: parseInt(qMatch[1]),
                question: text.replace(qStartRegex, '').trim(),
                options: [],
                answer: null
            };
            captureMode = 'QUESTION';
            return;
        }

        // 2. Check for Options
        if (currentQuestion) {
            // Does this line START with an option?
            const optMatch = text.match(optionRegex);

            // Or are we currently capturing options and this looks like one?
            if (optMatch || captureMode === 'OPTIONS') {
                captureMode = 'OPTIONS';

                // Handle multiple options on one line: "(a) X (b) Y"
                // Split by regex but keep delimiters
                // This is tricky. Simplified approach:
                // Check if line contains multiple markers.

                // Let's just push the whole line for now, but if it starts with option, treat as option.
                // If it's a continuation, append to last option.

                if (optMatch) {
                    currentQuestion.options.push(text);
                } else {
                    // Continuation? Or new option that regex missed?
                    // If we are in OPTIONS mode, precise splitting is hard without perfect regex.
                    // Just append to last option if exists.
                    if (currentQuestion.options.length > 0) {
                        currentQuestion.options[currentQuestion.options.length - 1] += " " + text;
                    } else {
                        // Weird case: Mode is options but no options yet? Maybe part of question?
                        currentQuestion.question += " " + text;
                    }
                }
                return;
            }

            // 3. Continuation of Question
            if (captureMode === 'QUESTION') {
                currentQuestion.question += " " + text;
            }
        }
    });

    if (currentQuestion) questions.push(currentQuestion);

    // Filter out bad parses (e.g. headers parsed as questions)
    // Real questions usually have options
    return questions.filter(q => q.options.length > 0);
}

// MAIN EXECUTION
const file = path.join(__dirname, '../../data/physisPYQ/alternating current.pdf');
const outputJson = path.join(__dirname, '../data/quizzes/debug_output_v2.json');

(async () => {
    try {
        console.log("Extracting lines with 2-Column Logic...");
        const lines = await extractStructuredText(file);

        console.log(`Extracted ${lines.length} lines. Parsing MCQs...`);
        const mcqs = parseMCQs(lines);

        console.log(`Found ${mcqs.length} valid questions.`);

        fs.writeFileSync(outputJson, JSON.stringify({
            stats: {
                totalLines: lines.length,
                totalQuestions: mcqs.length
            },
            questions: mcqs
        }, null, 2));

        console.log(`Saved structured output to: ${outputJson}`);

        // Preview
        console.log("--- MCQ Preview (First 2) ---");
        console.log(JSON.stringify(mcqs.slice(0, 2), null, 2));

    } catch (err) {
        console.error("Error:", err);
    }
})();
