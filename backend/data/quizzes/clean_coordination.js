const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes\\Coordination Compounds 1.json';

try {
    let rawData = fs.readFileSync(filePath, 'utf8');

    // 1. Fix concatenated arrays: replace `][` sequences with `,`
    // This handles `] [`, `]\n[`, `]\r\n[` etc.
    let fixedData = rawData.replace(/\]\s*\[/g, ',');

    // 2. Remove any potential trailing dots after the last closing brace before the final bracket (unlikely here but good safety)
    // and ensuring it ends with `]`
    fixedData = fixedData.trim();
    
    // Parse the JSON
    let questions = JSON.parse(fixedData);

    // 3. Re-index and clean
    questions = questions.map((q, index) => {
        // Fix ID
        q.id = index + 1;

        // Clean options (remove "A. ", "B. ", "a) ", "b) " prefixes if they exist - though looking at file they seem clean, 
        // but let's be safe if they exist in other parts)
        // actually looking at the file options are clean strings like "NO2−", "SCN−". 
        // I will just trim them.
        q.options = q.options.map(opt => opt.trim());
        
        // Ensure answer is valid index (0-3)
        // If answer is 1-4 based (which it looks like based on "answer": 1, "answer": 2), convert to 0-3 based?
        // Wait, let's check one question.
        // Q: "The IUPAC name of the complex [Co(NH3)5Cl]Cl2 is:"
        // Options: 
        // 0: Pentaamminechlorocobalt(II) chloride
        // 1: Pentaamminechlorocobalt(III) chloride  <-- Correct (Co is +3 here)
        // Answer in file: 1. 
        // So the file uses 0-based index? Or 1-based?
        // Let's check another.
        // Q: "Which of the following ligands shows both linkage and ambidentate behavior?"
        // Options: NO2- (0), SCN- (1), CN- (2), NH3 (3)
        // Answer in file: 1. SCN- is ambidentate. NO2- is also ambidentate.
        // Wait, NO2 ends up being nitro or nitrito. SCN ends up thiocyanato or isothiocyanato.
        // Both are ambidentate. 
        // Let's check Q: "The coordination number of the central metal atom in [Fe(C2O4)3]3− is:"
        // Options: 3, 4, 6, 2
        // Correct is 6 (index 2).
        // Answer in file: 2.
        // So 0, 1, 2 = 6.
        // It seems the answer is 0-based index. 
        // Let's validte Q: "Which complex will show cis-trans isomerism?"
        // Options: [Co(NH3)6]3+ (0), [Pt(NH3)2Cl2] (1), [Fe(CN)6]4- (2), [Ni(CO)4] (3)
        // Answer in file: 1. Pt(NH3)2Cl2 shows cis-trans. Correct.
        // So it is 0-based.
        
        return q;
    });

    // 4. Write back
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 4));
    console.log(`Successfully cleaned ${questions.length} questions in ${filePath}`);

} catch (err) {
    console.error('Error processing file:', err);
}
