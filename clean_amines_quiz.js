const fs = require('fs');
const path = require('path');

const logPath = 'cleanup_amines_debug.log';
function log(msg) {
    fs.appendFileSync(logPath, msg + '\n');
}

const filePath = path.join('backend', 'data', 'quizzes', 'amines 1.json');

try {
    log('Starting script for amines 1.json...');
    log(`Target file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        log('File does not exist!');
        process.exit(1);
    }

    log('Reading file...');
    let content = fs.readFileSync(filePath, 'utf8');
    log(`Read ${content.length} characters.`);

    // 1. Remove comment blocks /* ... */
    // Doing this BEFORE removing newlines to ensure block comments are correctly identified
    log('Removing comments...');
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Remove all newlines to fix "Bad control character" in strings
    // This turns the file into a single line, which is valid JSON (except for the structure errors we fix next)
    log('Removing newlines...');
    content = content.replace(/[\r\n]+/g, ' ');

    // 3. Fix the disconnection of arrays
    log('Merging arrays...');
    content = content.replace(/\]\s*\[/g, ',');

    // 4. Fix missing closing brackets (e.g. } [ -> }, { )
    log('Fixing malformed brackets...');
    content = content.replace(/\}(\s*)\[(\s*)\{/g, '},$1$2{');

    // 5. Fix trailing ].
    log('Fixing trailing junk...');
    content = content.replace(/\]\s*\.$/, ']');

    // 6. Fix double closing brackets
    content = content.replace(/\]\s*\]$/, ']');

    // 7. Remove AI citation artifacts
    log('Removing artifacts...');
    content = content.replace(/\s*:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

    // 8. Fix backslashes
    log('Fixing backslashes...');
    content = content.replace(/\\(?!")/g, '\\\\');
    content = content.replace(/\\\\\\\\/g, '\\\\');

    // 9. Fix "Explaination" typo
    content = content.replace(/"Explaination":/g, '"explanation":');

    // Attempt to parse
    log('Parsing JSON...');
    try {
        const data = JSON.parse(content);
        log(`Success! Parsed ${data.length} items.`);

        log('Re-indexing...');
        data.forEach((q, idx) => { q.id = idx + 1; });

        log('Saving file...');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
        log('Done.');

    } catch (parseErr) {
        log('JSON Parse Failed: ' + parseErr.message);
        fs.writeFileSync('debug_clean_amines_fail_v2.json', content, 'utf8');
    }

} catch (err) {
    log('Error: ' + err.message);
}
