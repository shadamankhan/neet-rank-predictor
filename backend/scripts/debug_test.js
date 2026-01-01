console.log("Step 1: Start");
const fs = require('fs');
console.log("Step 2: fs required");
const path = require('path');
console.log("Step 3: path required");
try {
    const pdfLib = require('pdf-lib');
    console.log("Step 4: pdf-lib required");
} catch (e) {
    console.error("Error requiring pdf-lib:", e);
}

const run = async () => {
    console.log("Step 5: Run async");
    // Just try to write a text file
    fs.writeFileSync('debug_output_simple.txt', 'Hello World');
    console.log("Step 6: File written");
};

run();
