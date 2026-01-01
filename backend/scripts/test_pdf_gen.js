const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const TEST_FILE = path.join(__dirname, '../data/quizzes/Botany set 1.json');
const OUTPUT_FILE = path.join(__dirname, '../data/quizzes/test_pdf_gen.pdf');

const run = async () => {
    console.log("Starting test PDF generation...");
    try {
        const fileContent = fs.readFileSync(TEST_FILE, 'utf8');
        const data = JSON.parse(fileContent);

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

        page.drawText('Test PDF Generation', {
            x: 50,
            y: height - 50,
            size: 20,
            font: font,
            color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(OUTPUT_FILE, pdfBytes);
        console.log("PDF Created Successfully at " + OUTPUT_FILE);

    } catch (e) {
        console.error("Error:", e);
    }
};

run();
