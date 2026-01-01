const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'quizzes');

// Function to clean a single file
function cleanFile(filePath) {
    try {
        let rawData = fs.readFileSync(filePath, 'utf8');

        // Fix concatenated arrays: replace '][' or '] [' or ']\n[' with ','
        // and remove any leading/trailing whitespace/newlines
        let cleanedData = rawData.replace(/\]\s*\[/g, ',');
        
        // Ensure it's wrapped in brackets if not already (though usually strict JSON requires it, 
        // sometimes files might be fragments, but here we assume mainly array concatenation issues)
        // If the replacements made it one valid array interior, we are good.
        
        // Parse to check validity
        let questions;
        try {
            questions = JSON.parse(cleanedData);
        } catch (parseError) {
             // If simple replace didn't work, maybe it already wasn't an array or had other issues.
             // Try to see if it's just raw objects separated by commas without outer brackets?
             // But the common issue described is `[...] [...]`.
             console.error(`Error parsing JSON in ${path.basename(filePath)}: ${parseError.message}`);
             return;
        }

        if (!Array.isArray(questions)) {
             console.error(`Content in ${path.basename(filePath)} is not an array.`);
             return;
        }

        // Re-index IDs
        questions.forEach((q, index) => {
            q.id = index + 1;
        });

        // Write back
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 4));
        console.log(`Success: ${path.basename(filePath)}`);

    } catch (err) {
        console.error(`Failed to process ${path.basename(filePath)}: ${err.message}`);
    }
}

// Find all files starting with 'b ' in the directory
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    const botanyFiles = files.filter(file => file.startsWith('b ') && file.endsWith('.json'));

    if (botanyFiles.length === 0) {
        console.log("No Botany files found starting with 'b '");
        return;
    }

    console.log(`Found ${botanyFiles.length} Botany files. processing...`);
    botanyFiles.forEach(file => {
        cleanFile(path.join(directoryPath, file));
    });
});
