const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const DATA_DIR = path.join(__dirname, '../../data/chemistryPYQ');

const cleanFilename = (originalName) => {
    // 1. Try splitting by " - "
    let parts = originalName.split(' - ');
    if (parts.length > 1) {
        return parts[0].trim() + '.pdf';
    }

    // 2. Try removing "_20_Years..." or similar via Regex
    // Pattern: Matches anything up to "_20_Years" or "_20 Years"
    // e.g., "Alcohols..._20_Years..."
    let match = originalName.match(/(.+?)(_20_Years| - 20 Years|_20 Years| 20 Years)/i);
    if (match) {
        let name = match[1].replace(/_/g, ' ').trim();
        // Remove trailing comma or chars
        name = name.replace(/,$/, '');
        return name + '.pdf';
    }

    return 'Cleaned_' + originalName;
};

const processPdfs = async () => {
    if (!fs.existsSync(DATA_DIR)) {
        console.error('Data directory not found!');
        return;
    }

    const files = fs.readdirSync(DATA_DIR);
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf') && !f.includes('_question_paper') && !f.includes('_answer_key'));

    console.log(`Found ${pdfs.length} PDFs to process.`);

    for (const file of pdfs) {
        try {
            // skip already cleaned short names if we can detect them? 
            // The originals have " - 20 Years" or "Specialized Pyq" usually.
            if (!file.includes('20 Years') && !file.includes('Specialized')) {
                console.log(`Skipping likely already clean file: ${file}`);
                continue;
            }

            const oldPath = path.join(DATA_DIR, file);
            const newName = cleanFilename(file);
            const newPath = path.join(DATA_DIR, newName);

            // If target exists, maybe skip or overwrite? Overwrite for now.

            console.log(`Processing: ${file} -> ${newName}`);

            const pdfBuffer = fs.readFileSync(oldPath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pageCount = pdfDoc.getPageCount();

            if (pageCount < 1) continue;

            // Create new PDF
            const newPdf = await PDFDocument.create();

            // Include all pages EXCEPT the last one (Answer Key)
            // If PDF has only 1 page, keep it (edge case)
            const pagesToKeepCount = pageCount > 1 ? pageCount - 1 : 1;
            const pagesToKeep = Array.from({ length: pagesToKeepCount }, (_, i) => i);

            const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);

            for (const page of copiedPages) {
                const { width, height } = page.getSize();

                // Mask Header (Top) - Optional, user asked for "footer and watermark"
                // But let's check image. Header seems cleanish? Footer definitely has links.

                // Mask Footer (Bottom)
                // Coordinate system: (0,0) is bottom-left.
                // Let's cover bottom 80 units.
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: width,
                    height: 80,
                    color: rgb(1, 1, 1), // White
                });

                newPdf.addPage(page);
            }

            const pdfBytes = await newPdf.save();
            fs.writeFileSync(newPath, pdfBytes);
            console.log(`Saved: ${newName}`);

        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }
    console.log('Batch processing complete.');
};

processPdfs();
