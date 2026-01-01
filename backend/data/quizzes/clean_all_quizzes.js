const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);

// List of known safe files to maybe skip or just process everything carefully
// We'll process everything to ensure consistency (Ids 1..N)

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        if (path.extname(file) === '.json') {
            processFile(path.join(directoryPath, file));
        }
    });
});

function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`Processing ${fileName}...`);

    try {
        let rawData = fs.readFileSync(filePath, 'utf8');
        let jsonData;
        let fixed = false;

        // Try parsing first
        try {
            jsonData = JSON.parse(rawData);
        } catch (e) {
            // Parsing failed, try fixing concatenated arrays
            // Regex to find ] followed by whitespace (optional) and [
            // Replace with ,
            const originalLength = rawData.length;
            const fixedData = rawData.replace(/\]\s*\[/g, ',');
            
            if (fixedData.length !== originalLength) {
                try {
                    jsonData = JSON.parse(fixedData);
                    console.log(`  [FIXED] Concatenated arrays merged in ${fileName}`);
                    fixed = true;
                } catch (e2) {
                    console.error(`  [ERROR] Failed to parse ${fileName} even after merge fix:`, e2.message);
                    return;
                }
            } else {
                 console.error(`  [ERROR] Failed to parse ${fileName} and no split arrays found:`, e.message);
                 return;
            }
        }

        // Now we have jsonData, let's normalize it
        if (!Array.isArray(jsonData)) {
            console.warn(`  [SKIP] content is not an array: ${fileName}`);
            return;
        }

        // Process questions
        let modified = false;
        const newQuestions = jsonData.map((q, index) => {
            // 1. Fix ID
            if (q.id !== index + 1) {
                // console.log(`    Re-indexing ID ${q.id} -> ${index + 1}`);
                q.id = index + 1;
                modified = true;
            }

            // 2. Validate/Fix Options
            if (q.options && Array.isArray(q.options)) {
                const cleanedOptions = q.options.map(opt => (typeof opt === 'string' ? opt.trim() : opt));
                // Basic check if options changed
                if (JSON.stringify(cleanedOptions) !== JSON.stringify(q.options)) {
                     q.options = cleanedOptions;
                     modified = true;
                }
            }

            // 3. Ensure Answer is valid
            // (Optional: Logic to ensure answer is within range 0 to options.length-1? 
            //  Assuming valid input for now, just type checking)

            return q;
        });

        // Always write back if it was a broken file we fixed, OR if we modified IDs/content
        if (fixed || modified) {
            fs.writeFileSync(filePath, JSON.stringify(newQuestions, null, 4));
            console.log(`  [SUCCESS] Updated ${fileName} (${newQuestions.length} questions)`);
        } else {
            console.log(`  [OK] No changes needed for ${fileName}`);
        }

    } catch (err) {
        console.error(`  [FATAL] Error processing ${fileName}:`, err);
    }
}
