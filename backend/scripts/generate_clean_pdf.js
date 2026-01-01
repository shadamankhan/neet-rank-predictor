const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');



const wrapText = (text, maxWidth, font, fontSize) => {
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

    // Normalize to NFKC (Compatibility Decomposition) to catch things like "Mathematical Italic r" -> "r"
    if (clean.normalize) {
        clean = clean.normalize('NFKC');
    }

    // Remove control characters like newlines which can break pdf-lib width calculation
    clean = clean.replace(/[\r\n]+/g, ' ');

    // Remove delimiters
    clean = clean.replace(/\$\$/g, '').replace(/\$/g, '');

    // Replace LaTeX subscripts with standard numbers (PDF standard fonts don't support unicode subscripts well)
    // _2 -> 2, _{10} -> 10
    clean = clean.replace(/_(\d)/g, '$1');
    clean = clean.replace(/_\{(\d+)\}/g, '$1');

    // Replace Superscripts
    // ^2 -> 2
    clean = clean.replace(/\^(\d)/g, '$1');
    clean = clean.replace(/\^\{([^}]+)\}/g, '$1');

    // Replace LaTeX symbols with best ASCII approximations
    clean = clean.replace(/\\rightarrow/g, '->');
    clean = clean.replace(/\\xrightarrow\{[^}]*\}/g, '->');
    clean = clean.replace(/\\rightleftharpoons/g, '<=>');
    clean = clean.replace(/\\Delta/g, 'Delta');
    clean = clean.replace(/\\circ/g, ' deg');

    // Unicode replacements (PDF-lib StandardFonts do not support these)
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
    clean = clean.replace(/\uf070/g, 'pi'); // Private use area Pi
    clean = clean.replace(/\uf020/g, ' '); // Private use area Space
    clean = clean.replace(/\uf02f/g, '/'); // Private use area Slash
    clean = clean.replace(/\uf030/g, '0');
    clean = clean.replace(/\uf031/g, '1');
    clean = clean.replace(/\uf032/g, '2');
    clean = clean.replace(/\uf033/g, '3');
    clean = clean.replace(/\uf034/g, '4');
    clean = clean.replace(/\uf035/g, '5');
    clean = clean.replace(/\uf036/g, '6');
    clean = clean.replace(/\uf037/g, '7');
    clean = clean.replace(/\uf038/g, '8');
    clean = clean.replace(/\uf039/g, '9');
    clean = clean.replace(/\uf06c/g, 'lambda'); // PUA Lambda
    clean = clean.replace(/\uf06d/g, 'mu'); // PUA Mu
    clean = clean.replace(/\uf03d/g, '='); // PUA Equal
    clean = clean.replace(/\uf02b/g, '+'); // PUA Plus
    clean = clean.replace(/\uf02d/g, '-'); // PUA Minus
    clean = clean.replace(/\uf0d7/g, 'x'); // PUA Multiply
    clean = clean.replace(/\uf0b0/g, 'deg'); // PUA Degree
    clean = clean.replace(/\uf072/g, 'rho'); // PUA Rho
    clean = clean.replace(/\uf06f/g, 'o'); // PUA Omicron
    clean = clean.replace(/\uf073/g, 'sigma'); // PUA Sigma
    clean = clean.replace(/\uf074/g, 'tau'); // PUA Tau
    clean = clean.replace(/\uf077/g, 'omega'); // PUA Omega
    clean = clean.replace(/\uf066/g, 'phi'); // PUA Phi
    clean = clean.replace(/\uf029/g, ')'); // PUA )
    clean = clean.replace(/\uf028/g, '('); // PUA (
    clean = clean.replace(/\uf029/g, ')'); // PUA )
    clean = clean.replace(/\uf028/g, '('); // PUA (
    clean = clean.replace(/\u02c9/g, '-'); // Modifier Macron -> minus
    clean = clean.replace(/\uf057/g, 'Ohm'); // PUA Capital Omega
    clean = clean.replace(/√/g, 'sqrt');
    clean = clean.replace(/\uf0a2/g, ' '); // PUA Bullet/Symbol
    clean = clean.replace(/\uf03e/g, '>'); // PUA >
    clean = clean.replace(/\uf03c/g, '<'); // PUA <
    clean = clean.replace(/\uf061/g, 'alpha'); // PUA Alpha
    clean = clean.replace(/\uf062/g, 'beta'); // PUA Beta
    clean = clean.replace(/\uf063/g, 'gamma'); // PUA Gamma
    clean = clean.replace(/\uf064/g, 'delta'); // PUA Delta
    clean = clean.replace(/\uf0be/g, '->'); // PUA Right Arrow
    clean = clean.replace(/\uf0ae/g, '->'); // PUA Right Arrow 2
    clean = clean.replace(/\uf05a/g, 'Z'); // PUA Z (Atomic Number)
    clean = clean.replace(/\uf02a/g, '*'); // PUA Asterisk
    clean = clean.replace(/\uf06e/g, 'nu'); // PUA Nu
    clean = clean.replace(/\uf071/g, 'theta'); // PUA Theta
    clean = clean.replace(/\uf044/g, 'Delta'); // PUA Capital Delta
    clean = clean.replace(/\uf0a3/g, '<='); // PUA <=
    clean = clean.replace(/\uf0b3/g, '>='); // PUA >=
    clean = clean.replace(/\uf0b5/g, 'proportional'); // PUA Proportional
    clean = clean.replace(/\u2044/g, '/'); // Fraction Slash
    clean = clean.replace(/\u025b/g, 'epsilon'); // Latin Small Letter Open E
    clean = clean.replace(/\uf067/g, 'gamma'); // PUA Gamma 2
    clean = clean.replace(/\u229d/g, '-'); // Circled Dash (Standard State)

    // Chemical cleanup
    clean = clean.replace(/\*\*/g, '');

    return clean;
};

const generatePdf = async (chapterName, subDir = 'chemistryPYQ') => {
    const DATA_DIR = path.join(__dirname, '../../data', subDir);
    const jsonFile = path.join(DATA_DIR, `${chapterName}_parsed.json`);
    const outputFile = path.join(DATA_DIR, `${chapterName}_New_Clean.pdf`);

    if (!fs.existsSync(jsonFile)) {
        console.error(`JSON file not found: ${jsonFile}`);
        process.exit(1);
    }

    console.log(`Generating PDF for ${chapterName}...`);
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Helper specific to font handling
    // We need a font that supports these unicode chars. StandardFonts.TimesRoman usually handles basic latin + greek + symbols well.
    // If not, we might see squares. But standard PDF fonts cover a lot.

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const maxWidth = width - (margin * 2);

    // Title
    page.drawText(`Chemistry PYQ: ${chapterName}`, {
        x: margin,
        y: y,
        size: 20,
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

        // Add Page if low
        if (y < 100) {
            page = pdfDoc.addPage();
            y = height - 50;
        }

        // Question
        const qClean = formatChemistryText(q.question);
        const qText = `Q${q.id}: ${qClean}`;
        const qLines = wrapText(qText, maxWidth, timesBoldFont, 12);

        for (const line of qLines) {
            page.drawText(line, { x: margin, y, size: 12, font: timesBoldFont });
            y -= 15;
        }
        y -= 5;

        // Options
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
        y -= 5;

        /* User requested NO answers in the same PDF
        // Correct Answer
        const ansText = `Correct Answer: ${String.fromCharCode(65 + q.correctAnswer)}`;
        if (y < 50) { page = pdfDoc.addPage(); y = height - 50; }
        page.drawText(ansText, { x: margin + 20, y, size: 11, font: timesBoldFont, color: rgb(0, 0.5, 0) });
        y -= 15;

        // Solution
        if (q.solution) {
            const solClean = formatChemistryText(q.solution);
            const solLines = wrapText(`Explanation: ${solClean}`, maxWidth - 20, timesRomanFont, 10);
            for (const line of solLines) {
                if (y < 50) { page = pdfDoc.addPage(); y = height - 50; }
                page.drawText(line, { x: margin + 20, y, size: 10, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3) });
                y -= 12;
            }
        }
        */

        y -= 20; // Spacing between questions
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, pdfBytes);
    console.log(`Generated Clean PDF using pdf-lib: ${outputFile}`);
};

// Main Execution
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("Usage: node generate_clean_pdf.js <ChapterName>");
        process.exit(1);
    }

    const chapterName = args[0];
    const subDir = args[1] || 'chemistryPYQ';
    generatePdf(chapterName, subDir);
}

module.exports = { generatePdf };
