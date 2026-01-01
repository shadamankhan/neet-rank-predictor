const fs = require('fs');
const path = require('path');

// Data extracted from the specialized PYQ document
const quizData = [
    {
        "question_id": 6,
        "question": "Which amongst the following will be most readily dehydrated under acidic conditions?",
        "options": [
            "1. 2-nitro-ethanol derivative",
            "2. 2-nitro-cyclohexanol derivative",
            "3. 4-nitro-cyclohexanol derivative",
            "4. 2-methyl-cyclohexanol derivative"
        ],
        "answer": 3,
        "explanation": "Dehydration involves carbocation formation. Electron-withdrawing groups like $NO_2$ destabilize the carbocation if they are too close, so the molecule with the nitro group furthest from the -OH group (para-position/4-position) reacts most readily[cite: 98, 107, 425]."
    },
    {
        "question_id": 7,
        "question": "Identify products A and B in the reaction of Benzyl phenyl ether with $HI$ and heat.",
        "options": [
            "1. Benzyl alcohol + Iodobenzene",
            "2. Benzyl iodide + Phenol",
            "3. Benzyl iodide + Benzene",
            "4. Benzyl alcohol + Phenol"
        ],
        "answer": 4,
        "explanation": "The reaction of ethers with $HI$ involves nucleophilic attack. Because the benzyl carbocation is highly stable, the reaction follows an $S_N1$ pathway leading to Benzyl iodide and Phenol[cite: 119, 140, 141, 426]."
    },
    {
        "question_id": 10,
        "question": "Identify the major product formed in the conversion of a cyclic ketone/alkene using $(i) NaBH_4$ and $(ii) H_2SO_4, \\Delta$.",
        "options": [
            "1. Cyclopentene derivative",
            "2. Cyclopentanol derivative",
            "3. Dihydropyran derivative",
            "4. Ring-contracted product"
        ],
        "answer": 1,
        "explanation": "$NaBH_4$ reduces the ketone to an alcohol, and $H_2SO_4$ with heat causes dehydration to form the most stable alkene[cite: 166, 168, 430]."
    },
    {
        "question_id": 12,
        "question": "Statement I: Lucas test distinguishes alcohols based on reactivity with conc. $HCl + ZnCl_2$. Statement II: Primary alcohols are most reactive and produce turbidity immediately.",
        "options": [
            "1. I is incorrect, II is correct",
            "2. Both I and II are correct",
            "3. Both I and II are incorrect",
            "4. I is correct, II is incorrect"
        ],
        "answer": 4,
        "explanation": "Statement I is true, but Statement II is false because Tertiary ($3^{\circ}$) alcohols are the most reactive, not primary[cite: 191, 192, 432]."
    },
    {
        "question_id": 3,
        "question": "Identify the major product D in the following reaction sequence:\n\n$CH_3 OH \\xrightarrow{SOCl_2} A \\xrightarrow{KCN} B \\xrightarrow{Na(Hg)/EtOH} C \\xrightarrow{(i)NaNO_2 /HCl,(ii)H_2 O} D$",
        "options": [
            "1. $CH_3 CH_2 NH_2$",
            "2. $CH_3 CH_2 Cl$",
            "3. $CH_3 CH_2 OH$",
            "4. $CH_3 OH$"
        ],
        "answer": 3,
        "explanation": "$CH_3 OH$ converts to $CH_3 Cl$ (A), then to $CH_3 CN$ (B). Reduction gives $CH_3 CH_2 NH_2$ (C), which diazotization and hydrolysis convert to Ethanol (D)."
    },
    {
        "question_id": 4,
        "question": "Identify the major product D in the following sequence:\n\n$CH_3 CH_2 OH \\xrightarrow{P+I_2} A \\xrightarrow{Mg/dry ether} B \\xrightarrow{HCHO} C \\xrightarrow{H_2 O} D$",
        "options": [
            "1. n-propyl alcohol",
            "2. isopropyl alcohol",
            "3. propanal",
            "4. propionic acid"
        ],
        "answer": 1,
        "explanation": "Ethanol is converted to Ethyl Iodide (A), then to Ethyl Magnesium Iodide (B). Reaction with Formaldehyde followed by hydrolysis adds one carbon to form n-propyl alcohol (D)."
    },
    {
        "question_id": 8,
        "question": "Which of the following reagents can be used to convert alcohols directly to carboxylic acids? (A) $CrO_3 - H_2SO_4$ (B) $K_2Cr_2O_7 + H_2SO_4$ (C) $KMnO_4 + KOH/H_3O^+$ (D) $Cu, 573 K$",
        "options": [
            "1. (B), (C), and (D) only",
            "2. (B), (D), and (E) only",
            "3. (A), (B), and (C) only",
            "4. (A), (B), and (E) only"
        ],
        "answer": 3,
        "explanation": "Strong oxidizing agents like Jones reagent ($CrO_3 - H_2SO_4$), acidified Dichromate, and alkaline Permanganate are required for this conversion."
    },
    {
        "question_id": 25,
        "question": "Identify the structure of intermediate A in the industrial preparation of phenol from Cumene (isopropylbenzene) reacted with $O_2$.",
        "options": [
            "1. Cumene free radical",
            "2. Cumene hydroperoxide ($C_6H_5C(CH_3)_2OOH$)",
            "3. Benzene hemiacetal",
            "4. Isopropyl phenyl ether"
        ],
        "answer": 3,
        "explanation": "The oxidation of cumene with air ($O_2$) leads to the formation of Cumene hydroperoxide as the key intermediate."
    },
    {
        "question_id": 19,
        "question": "What is the IUPAC name of the product formed when Acetone reacts with $C_2H_5MgBr$ in dry ether, followed by hydrolysis with $H_2O/H^+$?",
        "options": [
            "1. Pentan-3-ol",
            "2. 2-Methylbutan-2-ol",
            "3. 2-Methylpropan-2-ol",
            "4. Pentan-2-ol"
        ],
        "answer": 2,
        "explanation": "The addition of an ethyl group from the Grignard reagent to the carbonyl carbon of acetone creates a tertiary alcohol with a five-carbon chain and a methyl branch at the second carbon."
    }
];

// Ensure output directory exists
const outputDir = path.join(__dirname, '../data/quizzes');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
}

// Save to JSON file
const jsonPath = path.join(outputDir, 'neet_quiz.json');
fs.writeFileSync(jsonPath, JSON.stringify(quizData, null, 4));
console.log(`Quiz file '${jsonPath}' has been generated successfully.`);

// Helper to escape CSV fields
const escapeCsv = (str) => {
    if (typeof str !== 'string') return str;
    // If str contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

// Save to CSV file
const csvPath = path.join(outputDir, 'neet_quiz.csv');
const headers = Object.keys(quizData[0]).join(',');
const rows = quizData.map(row => {
    return Object.values(row).map(val => {
        if (Array.isArray(val)) {
            // Join array options with a pipe or newline for CSV representation
            return escapeCsv(val.join(' | '));
        }
        return escapeCsv(val);
    }).join(',');
});
const csvContent = [headers, ...rows].join('\n');

fs.writeFileSync(csvPath, csvContent);
console.log(`Quiz file '${csvPath}' has been generated successfully.`);
