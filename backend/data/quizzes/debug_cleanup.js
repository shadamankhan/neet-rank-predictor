const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'z Environmental Issues.json');
console.log(`Processing ${filePath}...`);

try {
    let rawData = fs.readFileSync(filePath, 'utf8');
    let jsonData;
    let fixed = false;

    // Try parsing first
    try {
        jsonData = JSON.parse(rawData);
    } catch (e) {
        console.log("Parsing failed, attempting merge fix...");
        // Parsing failed, try fixing concatenated arrays
        const originalLength = rawData.length;
        // Replace ] followed by optional whitespace and [ with ,
        const fixedData = rawData.replace(/\]\s*\[/g, ',');
        
        if (fixedData.length !== originalLength) {
            try {
                jsonData = JSON.parse(fixedData);
                console.log(`  [FIXED] Concatenated arrays merged.`);
                fixed = true;
            } catch (e2) {
                console.error(`  [ERROR] Failed to parse even after merge fix:`, e2.message);
                return;
            }
        } else {
             console.error(`  [ERROR] Failed to parse and no split arrays found:`, e.message);
             return;
        }
    }

    if (!Array.isArray(jsonData)) {
        console.warn(`  [SKIP] content is not an array.`);
        return;
    }

    // Process questions
    let modified = false;
    const newQuestions = jsonData.map((q, index) => {
        if (q.id !== index + 1) {
            q.id = index + 1;
            modified = true;
        }
        if (q.options && Array.isArray(q.options)) {
            const cleanedOptions = q.options.map(opt => (typeof opt === 'string' ? opt.trim() : opt));
            if (JSON.stringify(cleanedOptions) !== JSON.stringify(q.options)) {
                 q.options = cleanedOptions;
                 modified = true;
            }
        }
        return q;
    });

    if (fixed || modified) {
        fs.writeFileSync(filePath, JSON.stringify(newQuestions, null, 4));
        console.log(`  [SUCCESS] Updated file (${newQuestions.length} questions)`);
    } else {
        console.log(`  [OK] No changes needed`);
    }

} catch (err) {
    console.error(`  [FATAL] Error processing file:`, err);
}
