const fs = require('fs');
const path = require('path');

const QUIZZES_DIR = path.join(__dirname, '../data/quizzes');

/**
 * Helper: Parse filename to infer Subject and Chapter.
 * Returns { subject: string, chapter: string, type: 'CHAPTER' | 'SET' }
 */
const parseMetadataFromFilename = (filename, folderName = null) => {
    const lower = filename.toLowerCase();

    let subject = 'Unknown';

    // 1. Priority: Folder Name (if not root 'quizzes')
    if (folderName && folderName !== 'quizzes') {
        const fLower = folderName.toLowerCase();
        if (fLower.includes('physics')) subject = 'Physics';
        else if (fLower.includes('chemistry')) subject = 'Chemistry';
        else if (fLower.includes('botany') || fLower.includes('zoology') || fLower.includes('biology')) subject = 'Biology';
        else if (fLower === 'maths' || fLower === 'mathematics') subject = 'Maths';

        // Specific handling for Zoology/Botany separation if needed, but usually lumped as Biology for NEET
        // If you want distinct subjects:
        // if (fLower.includes('botany')) subject = 'Botany';
        // if (fLower.includes('zoology')) subject = 'Zoology';
    }

    // 2. Fallback: Filename parsing
    if (subject === 'Unknown') {
        if (lower.includes('physics') || lower.includes('kinematics') || lower.includes('motion') || lower.includes('optics') || lower.includes('capacitance') || lower.includes('magnetic')) subject = 'Physics';
        else if (lower.includes('chemistry') || lower.includes('organic') || lower.includes('bonding') || lower.includes('equilibrium') || lower.includes('structure')) subject = 'Chemistry';
        else if (lower.includes('biology') || lower.includes('zoology') || lower.includes('botany') || lower.includes('cell') || lower.includes('plant') || lower.includes('animal')) subject = 'Biology';

        // Refinement based on specific known prefixes in the user's dir
        if (filename.startsWith('b ')) subject = 'Biology'; // e.g. "b Cell..."
        if (filename.startsWith('z ')) subject = 'Biology'; // e.g. "z Animal..."
    }

    // Chapter Name cleaning
    let chapter = filename.replace('.json', '');
    // Remove "Set X", "set X" patterns if it's a mixed set
    const isSet = /set\s*\d+/i.test(chapter);

    return {
        subject,
        chapter: chapter,
        type: isSet ? 'SET' : 'CHAPTER'
    };
};

/**
 * Helper: Load all questions from disk and index them.
 * In a real app with DB, this would be a DB query.
 * Here we cache it in memory for performance (assuming JSONs aren't massive suitable for < 500MB heap).
 */
let questionCache = null;

const loadQuestionBank = () => {
    if (questionCache) return questionCache;

    const allQuestions = [];


    try {
        if (!fs.existsSync(QUIZZES_DIR)) return [];

        // Recursive file finder
        const getAllFiles = (dir, fileList = []) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                if (fs.statSync(fullPath).isDirectory()) {
                    getAllFiles(fullPath, fileList);
                } else if (item.endsWith('.json')) {
                    fileList.push(fullPath);
                }
            });
            return fileList;
        };

        const files = getAllFiles(QUIZZES_DIR);

        files.forEach(filePath => {
            const file = path.basename(filePath); // Keep filename for metadata parsing
            const folderName = path.basename(path.dirname(filePath)); // Get parent folder

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const questions = JSON.parse(content);

                if (!Array.isArray(questions)) return;

                const meta = parseMetadataFromFilename(file, folderName);

                questions.forEach(q => {
                    // Assign a stable unique ID if possible, else combination of file+index
                    const uniqueId = q.id ? `${file}_${q.id}` : `${file}_idx_${allQuestions.length}`;

                    // Mock difficulty if missing (25% Easy, 50% Medium, 25% Hard)
                    // We use a deterministic hash of the ID to assign difficulty so it stays constant for the same question
                    let distinct = 0;
                    for (let i = 0; i < uniqueId.length; i++) distinct += uniqueId.charCodeAt(i);
                    const diffMod = distinct % 4;
                    let difficulty = 'Medium';
                    if (diffMod === 0) difficulty = 'Easy';
                    if (diffMod === 3) difficulty = 'Hard';

                    allQuestions.push({
                        ...q,
                        _uid: uniqueId,
                        _subject: meta.subject,
                        _chapter: meta.chapter,
                        _difficulty: difficulty,
                        _sourceFile: file
                    });
                });
            } catch (e) {
                // Skip bad files
            }
        });
    } catch (e) {
        console.error("Error loading question bank:", e);
    }

    questionCache = allQuestions;
    return allQuestions;
};

/**
 * Core Generation Logic
 * @param {Object} constraints - { totalQuestions, subjectDistribution: { Physics: 10, ... }, difficultyDistribution: { Easy: 0.25 ... } }
 */
const generateTest = (constraints) => {
    const allQuestions = loadQuestionBank();
    const testQuestions = {
        Physics: [],
        Chemistry: [],
        Biology: []
    };

    const usedIds = new Set(constraints.excludeIds || []);

    // NEET High Weightage Chapters (approximate list for "Rank Booster")
    const HIGH_YIELD_CHAPTERS = [
        "rotational motion", "optics", "electrostatics", "thermodynamics", "current electricity", // Physics
        "bonding", "coordination compounds", "equilibrium", "aldehydes", "thermodynamics", // Chemistry
        "genetics", "biotech", "reproduction", "cell", "ecology", "plant physiology" // Biology
    ];

    // Process each subject constraint
    Object.keys(constraints.subjectDistribution || {}).forEach(subject => {
        const count = constraints.subjectDistribution[subject];
        if (!count) return;

        // Filter pool by subject
        let pool = allQuestions.filter(q => q._subject === subject && !usedIds.has(q._uid));

        // 1. Chapter Filter
        if (constraints.chapters && constraints.chapters.length > 0) {
            pool = pool.filter(q => constraints.chapters.some(c => q._chapter.toLowerCase().includes(c.toLowerCase())));
        }

        // 2. High Yield / Rank Booster Mode
        if (constraints.mode === "rank_booster") {
            // Filter only high yield chapters
            pool = pool.filter(q => HIGH_YIELD_CHAPTERS.some(hy => q._chapter.toLowerCase().includes(hy)));
        }

        // Shuffle pool
        pool = pool.sort(() => 0.5 - Math.random());

        // Select
        const selected = pool.slice(0, count);
        testQuestions[subject] = selected.map(q => ({
            id: q._uid,
            original_id: q.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
            image: q.image,
            subject: q._subject,
            difficulty: q._difficulty,
            chapter: q._chapter // Important: Return chapter name
        }));
    });

    // Extract unique chapters used
    const chaptersUsed = new Set();
    Object.values(testQuestions).flat().forEach(q => {
        if (q.chapter) chaptersUsed.add(q.chapter);
    });

    return {
        test_id: `AI_GEN_${Date.now()}`,
        title: constraints.title, // Pass through
        testType: constraints.testType, // Pass through
        sections: testQuestions,
        chapters: Array.from(chaptersUsed) // Metadata for Frontend/AI Reply
    };
};

module.exports = {
    generateTest
};
