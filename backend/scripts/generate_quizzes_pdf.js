const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const LOG_FILE = path.join(__dirname, 'generation.log');

const log = (msg) => {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
};


const QUIZZES_DIR = path.join(__dirname, '../data/quizzes');

const wrapText = (text, maxWidth, font, fontSize) => {
    if (!text) return [];
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

// Helper to clean LaTeX for PDF (Standard ASCII replacement)
const formatChemistryText = (text) => {
    if (!text) return "";
    let clean = text;

    // Normalize to NFKC (Compatibility Decomposition)
    if (clean.normalize) {
        clean = clean.normalize('NFKC');
    }

    // Remove control characters like newlines
    clean = clean.replace(/[\r\n]+/g, ' ');

    // Remove delimiters
    clean = clean.replace(/\$\$/g, '').replace(/\$/g, '');

    // Replace LaTeX subscripts with standard numbers
    clean = clean.replace(/_(\d)/g, '$1');
    clean = clean.replace(/_\{(\d+)\}/g, '$1');

    // Replace Superscripts
    clean = clean.replace(/\^(\d)/g, '$1');
    clean = clean.replace(/\^\{([^}]+)\}/g, '$1');

    // Replace LaTeX symbols with best ASCII approximations
    clean = clean.replace(/\\rightarrow/g, '->');
    clean = clean.replace(/\\xrightarrow\{[^}]*\}/g, '->');
    clean = clean.replace(/\\rightleftharpoons/g, '<=>');
    clean = clean.replace(/\\Delta/g, 'Delta');
    clean = clean.replace(/\\circ/g, ' deg');

    // Unicode replacements
    clean = clean.replace(/⟶/g, '->');
    clean = clean.replace(/→/g, '->');
    clean = clean.replace(/←/g, '<-');
    clean = clean.replace(/⇌/g, '<=>');
    clean = clean.replace(/⇋/g, '<=>');
    clean = clean.replace(/↔/g, '<->');
    clean = clean.replace(/°/g, ' deg');
    clean = clean.replace(/Δ/g, 'Delta');
    clean = clean.replace(/δ/g, 'delta');
    clean = clean.replace(/α/g, 'alpha');
    clean = clean.replace(/β/g, 'beta');
    clean = clean.replace(/γ/g, 'gamma');
    clean = clean.replace(/σ/g, 'sigma');
    clean = clean.replace(/μ/g, 'mu');
    clean = clean.replace(/ω/g, 'omega');
    clean = clean.replace(/π/g, 'pi');
    clean = clean.replace(/λ/g, 'lambda');
    clean = clean.replace(/ν/g, 'nu');
    clean = clean.replace(/φ/g, 'phi');
    clean = clean.replace(/ρ/g, 'rho');
    clean = clean.replace(/τ/g, 'tau');
    clean = clean.replace(/ψ/g, 'psi');
    clean = clean.replace(/χ/g, 'chi');
    clean = clean.replace(/η/g, 'eta');
    clean = clean.replace(/κ/g, 'kappa');
    clean = clean.replace(/ξ/g, 'xi');
    clean = clean.replace(/ζ/g, 'zeta');
    clean = clean.replace(/ϕ/g, 'phi'); // Variant phi
    clean = clean.replace(/∝/g, 'proportional');
    clean = clean.replace(/∞/g, 'infinity');
    clean = clean.replace(/−/g, '-');
    clean = clean.replace(/×/g, 'x');
    clean = clean.replace(/≠/g, '!=');
    clean = clean.replace(/≤/g, '<=');
    clean = clean.replace(/≥/g, '>=');
    clean = clean.replace(/±/g, '+/-');
    clean = clean.replace(/′/g, "'");
    clean = clean.replace(/″/g, '"');
    clean = clean.replace(/↑/g, '(up)');
    clean = clean.replace(/↓/g, '(down)');
    clean = clean.replace(/⊕/g, '(+)');
    clean = clean.replace(/⊖/g, '(-)');
    clean = clean.replace(/⊗/g, '(x)');
    clean = clean.replace(/≡/g, '===');
    clean = clean.replace(/≈/g, '~=');
    clean = clean.replace(/Å/g, 'A');
    clean = clean.replace(/ε/g, 'epsilon');
    clean = clean.replace(/θ/g, 'theta');
    clean = clean.replace(/Ω/g, 'Ohm');
    clean = clean.replace(/\uf070/g, 'pi');
    clean = clean.replace(/\uf020/g, ' ');
    clean = clean.replace(/\uf02f/g, '/');
    clean = clean.replace(/√/g, 'sqrt');
    clean = clean.replace(/\*\*/g, '');

    return clean;
};

const generatePdfForFile = async (filename) => {
    const jsonFile = path.join(QUIZZES_DIR, filename);
    const pdfFilename = filename.replace('.json', '.pdf');
    const outputFile = path.join(QUIZZES_DIR, pdfFilename);

    log(`Processing: ${filename}`);

    let data;
    try {
        const fileContent = fs.readFileSync(jsonFile, 'utf8');
        data = JSON.parse(fileContent);
    } catch (err) {
        log(`Error reading/parsing ${filename}: ${err.message}`);
        return;
    }

    if (!Array.isArray(data)) {
        log(`Skipping ${filename}: Root is not an array.`);
        return;
    }

    try {
        const pdfDoc = await PDFDocument.create();
        // Embed standard fonts
        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        // Initial page setup
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        let y = height - 50;
        const margin = 50;
        const maxWidth = width - (margin * 2);

        // Title
        const title = filename.replace('.json', '');
        page.drawText(`Quiz: ${title}`, {
            x: margin,
            y: y,
            size: 18,
            font: timesBoldFont,
            color: rgb(0, 0, 0),
        });
        y -= 30;

        page.drawLine({
            start: { x: margin, y: y + 10 },
            end: { x: width - margin, y: y + 10 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        y -= 20;

        for (let i = 0; i < data.length; i++) {
            const q = data[i];

            // Check if we need a new page
            // Estimate needed space: question lines + option lines + padding
            // If y is too low, just add a page
            if (y < 100) {
                page = pdfDoc.addPage();
                y = height - 50;
            }

            // Question
            const qClean = formatChemistryText(q.question);
            const qText = `Q${q.id || (i + 1)}: ${qClean}`;
            const qLines = wrapText(qText, maxWidth, timesBoldFont, 12);

            for (const line of qLines) {
                if (y < 50) { page = pdfDoc.addPage(); y = height - 50; }
                page.drawText(line, { x: margin, y, size: 12, font: timesBoldFont });
                y -= 15;
            }
            y -= 5;

            // Options
            if (Array.isArray(q.options)) {
                for (let j = 0; j < q.options.length; j++) {
                    const optLabel = String.fromCharCode(65 + j);
                    const optClean = formatChemistryText(q.options[j]);
                    const optText = `${optLabel}) ${optClean}`;
                    const optLines = wrapText(optText, maxWidth - 20, timesRomanFont, 11);

                    for (const line of optLines) {
                        if (y < 50) { page = pdfDoc.addPage(); y = height - 50; }
                        page.drawText(line, { x: margin + 20, y, size: 11, font: timesRomanFont });
                        y -= 14;
                    }
                }
            }
            y -= 15; // Spacing between questions
        }

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputFile, pdfBytes);
        log(`Generated PDF: ${outputFile}`);
    } catch (e) {
        log(`Error generating PDF for ${filename}: ${e.message}`);
    }
};

const processAllQuizzes = async () => {
    if (!fs.existsSync(QUIZZES_DIR)) {
        log(`Directory not found: ${QUIZZES_DIR}`);
        return;
    }

    const files = fs.readdirSync(QUIZZES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('debug_') && !f.endsWith('.pdf.json'));

    log(`Found ${jsonFiles.length} JSON quiz files.`);

    for (const file of jsonFiles) {
        await generatePdfForFile(file);
    }
};

processAllQuizzes();
