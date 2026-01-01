const fs = require('fs');
const path = require('path');
const pdfLibrary = require('pdf-parse');

console.log('pdfLibrary type:', typeof pdfLibrary);
console.log('pdfLibrary keys:', Object.keys(pdfLibrary));

const filePath = path.join(__dirname, '../../data/chemistryPYQ/ATOMIC STRUCTURE.pdf');

if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
}

const dataBuffer = fs.readFileSync(filePath);

try {
    const { PDFParse } = pdfLibrary;
    // It seems PDFParse is likely the main class.
    // Based on typical usage of such libs, maybe new PDFParse(buffer) or similar.
    // Let's try to look for a 'load' or 'extract' or just log the instance.

    // Actually, looking at the keys again, there is no obvious 'text' helper.
    // The previous error "pdf is not a function" was on the default export.

    // Let's try simpler:
    // Some versions of pdf-parse export the function directly but we saw an object.

    // Let's try to see if we can use 'pdfjs-dist' directly which is a dependency.
    // Use dynamic import for ESM module
    (async () => {
        try {
            // Importing from the mjs file directly
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

            console.log("Using PDFJS directly (ESM import success)");

            // Set worker (optional but good practice, though usually unnecessary for pure text in node)
            // pdfjs.GlobalWorkerOptions.workerSrc = ... 

            const uint8Array = new Uint8Array(dataBuffer);
            const loadingTask = pdfjs.getDocument(uint8Array);
            const doc = await loadingTask.promise;

            console.log("PDF Loaded, pages:", doc.numPages);
            let fullText = "";

            const pagePromises = [];
            for (let i = 1; i <= doc.numPages; i++) {
                pagePromises.push(doc.getPage(i).then(page => {
                    return page.getTextContent().then(textContent => {
                        return textContent.items.map(item => item.str).join(' ');
                    });
                }));
            }

            const pages = await Promise.all(pagePromises);
            fullText = pages.join('\n\n');
            console.log("--- EXTRACTED TEXT ---");
            console.log(fullText.substring(0, 2000));

        } catch (err) {
            console.error("Async error:", err);
        }
    })();

} catch (e) {
    console.error("Runtime error:", e);
}
