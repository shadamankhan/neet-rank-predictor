const fs = require('fs');
const path = require('path');

const filePath = path.join('backend', 'data', 'quizzes', 'HALOALKANE AND HALOARENES 1.json');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove comment blocks /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Fix the disconnection of arrays: replace `] [` or `]\n[` or `]\r\n[` with `,`
    // using \s* matches any whitespace including newlines
    content = content.replace(/\]\s*\[/g, ',');

    // 3. Fix the case where closing bracket is missing or malformed: `} [` -> `}, {`
    // This handles cases where `] [` might have been `} [` (missing closing bracket of array)
    // But mostly we see `] [` in the user paste. 
    // We'll also handle `} [ {` just in case
    content = content.replace(/\}(\s*)\[(\s*)\{/g, '},$1$2{');

    // 4. Fix trailing ]. at the end of file
    content = content.replace(/\]\s*\.$/, ']');

    // 5. Detect and fix double closing brackets at the end `]]` -> `]`
    content = content.replace(/\]\s*\]$/, ']');

    // 6. Remove AI citation artifacts :contentReference[oaicite:X]{index=Y}
    content = content.replace(/\s*:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

    // 7. Fix invalid backslash escapes (LaTeX)
    // Replace single backslash with double backslash, EXCEPT when followed by " (JSON quote)
    // This is crucial for things like \rightarrow appearing as "\rightarrow" in source text, 
    // which needs to be "\\rightarrow" in valid JSON string.
    content = content.replace(/\\(?!")/g, '\\\\');

    // 8. Normalize triple/quadruple backslashes back to double
    // This prevents double-processing from making \\\\rightarrow
    content = content.replace(/\\\\\\\\/g, '\\\\');

    // Attempt to parse
    try {
        const data = JSON.parse(content);
        console.log(`Success! Parsed ${data.length} items.`);

        // Re-index to ensure unique IDs and continuous numbering
        // The file had gaps (1-85, then 101-140)
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

        fs.writeFileSync('debug_clean_halo_fail.json', content, 'utf8');
    }

} catch (err) {
    console.error('Error:', err);
}
