const fs = require('fs');
const path = require('path');

console.log("Starting cleanup...");
const filePath = path.join(__dirname, 'backend', 'data', 'quizzes', 'SOLUTIONS 1.json');

try {
    let rawData = fs.readFileSync(filePath, 'utf8');
    console.log("Read raw file.");

    // Replace all occurrences of ] followed by optional whitespace and [ with ,
    const fixedDataString = rawData.replace(/\]\s*\[/g, ',');

    // Also remove any leading/trailing brackets to just get the objects, then wrap
    let content = fixedDataString.trim();
    if (content.startsWith('[')) content = content.substring(1);
    if (content.endsWith(']')) content = content.substring(0, content.length - 1);

    // Now we have a list of objects separated by commas. Wrap perfectly.
    const finalString = `[${content}]`;

    let allQuestions;
    try {
        allQuestions = JSON.parse(finalString);
    } catch (e) {
        console.error("JSON Parse Error:", e.message);
        // Let's try to print a snippet around the error
        const match = e.message.match(/position (\d+)/);
        if (match) {
            const pos = parseInt(match[1]);
            console.log("Error context:", finalString.substring(pos - 20, pos + 20));
        }
        process.exit(1);
    }

    console.log(`Parsed ${allQuestions.length} questions.`);

    const questions = [];
    allQuestions.forEach((q, index) => {
        if (!q.question || !q.options) return;

        q.id = index + 1;
        q.options = q.options.map(o => String(o).trim());
        q.question = q.question.trim();
        q.explanation = q.explanation ? q.explanation.trim() : "";

        // Remove 'answer' if it's not a number or valid index? 
        // Existing answers seem to be 0-based indices. Keep as is.
        q.answer = Number(q.answer);

        questions.push(q);
    });

    console.log(`Saving ${questions.length} cleaned questions.`);
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 4), 'utf8');
    console.log("Done.");

} catch (err) {
    console.error("Fatal:", err);
}
