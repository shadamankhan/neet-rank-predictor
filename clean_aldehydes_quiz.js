const fs = require('fs');
const path = require('path');

const filePath = path.join('backend', 'data', 'quizzes', 'Aldehydes_Ketones_CarboxylicAcids_1.json');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove comment blocks /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Fix the disconnection of arrays: replace `] [` or `]\n[` with `,`
    // This worked for normal concat
    content = content.replace(/\]\s*\[/g, ',');

    // 3. Fix the case where closing bracket is missing: `} [` -> `}, {`
    // Convert `} [ {` -> `}, {`
    content = content.replace(/\}(\s*)\[(\s*)\{/g, '},$1$2{');

    // 4. Fix trailing ]. at the end of file (from user paste error)
    content = content.replace(/\]\s*\.$/, ']');

    // 5. Detect and fix double closing brackets at the end `]]` -> `]`
    // This was the cause of the last error
    content = content.replace(/\]\s*\]$/, ']');

    // 6. Remove AI citation artifacts :contentReference[oaicite:X]{index=Y}
    content = content.replace(/\s*:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

    // 7. Fix invalid backslash escapes (LaTeX)
    // Replace single backslash with double backslash, EXCEPT when followed by " (JSON quote)
    content = content.replace(/\\(?!")/g, '\\\\');

    // 8. Normalize triple/quadruple backslashes back to double
    content = content.replace(/\\\\\\\\/g, '\\\\');

    // Attempt to parse
    try {
        const data = JSON.parse(content);
        console.log(`Success! Parsed ${data.length} items.`);

        // Re-index to ensure unique IDs
        data.forEach((q, idx) => { q.id = idx + 1; });

        // Write back clean formatted JSON
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
        console.log('Saved cleaned file.');

        // Check for duplicates/missing IDs to be sure
        const ids = new Set(data.map(q => q.id));
        console.log(`Unique questions: ${ids.size}`);

    } catch (parseErr) {
        console.error('JSON Parse Failed after cleaning:', parseErr.message);

        // Find position to help debug
        let pos = parseInt(parseErr.message.match(/position (\d+)/)?.[1] || 0);
        if (pos) {
            console.log('Context around error:');
            console.log(content.substring(Math.max(0, pos - 50), pos + 50));
        }

        fs.writeFileSync('debug_clean_fail.json', content, 'utf8');
    }

} catch (err) {
    console.error('Error:', err);
}
