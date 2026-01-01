const fs = require('fs');
const path = require('path');

const logPath = 'cleanup_arines_debug.log';
function log(msg) {
    fs.appendFileSync(logPath, msg + '\n');
}

const filePath = path.join('backend', 'data', 'quizzes', 'ARINES 1.json');

try {
    log('Starting script for ARINES 1.json...');
    log(`Target file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        log('File does not exist!');
        process.exit(1);
    }

    log('Reading file...');
    let content = fs.readFileSync(filePath, 'utf8');
    log(`Read ${content.length} characters.`);

    // 1. Remove comment blocks /* ... */
    log('Removing comments...');
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Fix the disconnection of arrays
    log('Merging arrays...');
    content = content.replace(/\]\s*\[/g, ',');

    // 3. Fix missing closing brackets
    log('Fixing malformed brackets...');
    content = content.replace(/\}(\s*)\[(\s*)\{/g, '},$1$2{');

    // 4. Fix trailing ].
    log('Fixing trailing junk...');
    content = content.replace(/\]\s*\.$/, ']');

    // 5. Fix double closing brackets
    content = content.replace(/\]\s*\]$/, ']');

    // 6. Remove AI citation artifacts
    log('Removing artifacts...');
    content = content.replace(/\s*:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

    // 7. Fix backslashes
    log('Fixing backslashes...');
    content = content.replace(/\\(?!")/g, '\\\\');
    content = content.replace(/\\\\\\\\/g, '\\\\');

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
        fs.writeFileSync('debug_clean_arines_fail.json', content, 'utf8');
    }

} catch (err) {
    log('Error: ' + err.message);
}
