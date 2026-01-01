const testGenerator = require('../services/testGenerator');

// POST /api/ai/generate
const generateTest = (req, res) => {
    try {
        const constraints = req.body;

        // Basic validation
        if (!constraints || !constraints.subjectDistribution) {
            return res.status(400).json({
                ok: false,
                message: "Invalid constraints. 'subjectDistribution' is required."
            });
        }

        const testPaper = testGenerator.generateTest(constraints);

        res.json({
            ok: true,
            data: testPaper
        });
    } catch (error) {
        console.error("Test Generation Error:", error);
        res.status(500).json({ ok: false, message: "Internal Server Error during generation" });
    }
};

// POST /api/ai/chat (Smart Admin Prompt Implementation)
const chatWithMentor = (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();

        let reply = "I am your NEET Mentor. How can I help you today?";
        let action = null;

        // --- SMART PARSER LOGIC ---

        // 1. FULL SYLLABUS MOCK TEST
        // Pattern: "full syllabus", "mock test", "neet 2026" (optional)
        if (lowerMsg.includes('full syllabus') || (lowerMsg.includes('mock') && lowerMsg.includes('test'))) {
            const yearStr = lowerMsg.match(/neet\s+(\d{4})/)?.[1] || "2026";
            reply = `Generating **NEET ${yearStr} Full Syllabus Mock Test** (180 Qs).\nStandard NTA Pattern: Phys(45), Chem(45), Bio(90).`;

            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "Full Mock",
                    title: `NEET ${yearStr} - Full Syllabus Mock Test - 01`, // Smart Title
                    subjectDistribution: { Physics: 45, Chemistry: 45, Biology: 90 },
                    chapters: []
                }
            };
        }

        // 2. CHAPTER TEST (e.g., "Physics chapter test... Current Electricity")
        // Pattern: "chapter test", subject name, chapter name
        else if (lowerMsg.includes('chapter test')) {
            const subject = ['physics', 'chemistry', 'biology', 'botany', 'zoology'].find(s => lowerMsg.includes(s));
            // Simple extraction: assume chapter name follows "chapter:" or is the rest of the sentence?
            // For now, let's hardcode a few common ones or look for "chapter: <name>" pattern if user follows it,
            // or just generic fallback if we can't parse perfectly without NLP.
            // User Prompt Example: "Create a Physics chapter test for NEET 2025. Chapter: Current Electricity."

            let chapterName = "General";
            if (lowerMsg.includes("current electricity")) chapterName = "Current Electricity";
            else if (lowerMsg.includes("thermodynamics")) chapterName = "Thermodynamics";
            else if (lowerMsg.includes("kinematics")) chapterName = "Kinematics";
            // ... add more detection as needed or generic regex

            const subName = subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : "Physics";

            reply = `Generating **${subName} Chapter Test**: ${chapterName}.`;
            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "Chapter Test",
                    title: `NEET 2025 - ${subName} - ${chapterName} - Chapter Test - 01`,
                    subjectDistribution: { [subName]: 30 }, // Default 30 for chapter test
                    chapters: [chapterName]
                }
            };
        }

        // 3. NCERT LINE-BY-LINE
        // Pattern: "ncert", "line by line"
        else if (lowerMsg.includes('ncert') && lowerMsg.includes('line')) {
            reply = "Generating **NEET 2026 - NCERT Line by Line Test** (200 Qs).";
            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "NCERT Line by Line",
                    title: `NEET 2026 - NCERT Line by Line - 01`,
                    subjectDistribution: { Physics: 50, Chemistry: 50, Biology: 100 },
                    chapters: []
                }
            };
        }

        // 4. SUBJECT TEST (MIXED)
        // Pattern: "subject test", specific subject
        else if (lowerMsg.includes('subject test')) {
            const subject = ['physics', 'chemistry', 'biology'].find(s => lowerMsg.includes(s)) || 'Chemistry';
            const subName = subject.charAt(0).toUpperCase() + subject.slice(1);

            reply = `Generating **${subName} Subject Test** (Mixed Chapters).`;
            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "Subject Test",
                    title: `NEET 2025 - ${subName} Subject Test - 01`,
                    subjectDistribution: { [subName]: 45 },
                    chapters: []
                }
            };
        }

        // 5. PYQ BASED TEST
        // Pattern: "pyq", "prior year", "last 10 years"
        else if (lowerMsg.includes('pyq') || lowerMsg.includes('previous year')) {
            const subject = ['physics', 'chemistry', 'biology'].find(s => lowerMsg.includes(s)) || 'Biology';
            const subName = subject.charAt(0).toUpperCase() + subject.slice(1);

            reply = `Generating **${subName} PYQ Test** (Last 10 Years).`;
            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "PYQ Test",
                    title: `NEET - ${subName} PYQ Test (Last 10 Years)`,
                    subjectDistribution: { [subName]: 90 }, // PYQ usually higher count? User said 90.
                    chapters: []
                }
            };
        }

        // 6. RANK BOOSTER / HIGH YIELD
        // Pattern: "rank", "booster", "high yield", "important chapters"
        else if (lowerMsg.includes('rank') || lowerMsg.includes('yield') || lowerMsg.includes('important')) {
            reply = "Generating **NEET Rank Booster Test** (Focused on High-Weightage Chapters).\nFocus: Rotational Motion, Optics, Genetics, Equilibrium, etc.";
            action = {
                type: 'GENERATE_TEST',
                constraints: {
                    testType: "Rank Booster",
                    title: "NEET 2025 - Rank Booster Test (High Yield)",
                    subjectDistribution: { Physics: 45, Chemistry: 45, Biology: 90 },
                    mode: "rank_booster",
                    chapters: []
                }
            };
        }

        // Generic / Fallback
        else if (lowerMsg.includes('help') || lowerMsg.includes('hello')) {
            reply = "Hello Admin! I am your Test Generator. Commands I understand:\n" +
                "1. 'Full Syllabus Mock Test'\n" +
                "2. 'Rank Booster Test' (High Yield Chapters)\n" +
                "3. 'Physics Chapter Test: [Chapter Name]'\n" +
                "4. 'NCERT Line by Line Test'\n" +
                "5. 'PYQ Test' (Previous Years)";
        }
        else {
            reply = "I didn't recognize that command. To ensure quality, please use standard commands like:\n" +
                "• **'Create a Rank Booster test'**\n" +
                "• **'Generate Full Mock Test'**\n" +
                "• **'Physics Chapter Test'**";
        }

        res.json({
            ok: true,
            reply: reply,
            action: action
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ ok: false, message: "Chat service error" });
    }
};

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/test_series_db.json');

// POST /api/ai/save
const saveTest = (req, res) => {
    try {
        const testPaper = req.body;

        if (!testPaper || !testPaper.sections) {
            return res.status(400).json({ ok: false, message: "Invalid test data" });
        }

        // 1. Read DB
        if (!fs.existsSync(DB_PATH)) {
            return res.status(500).json({ ok: false, message: "Database not found" });
        }
        const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

        // 2. Flatten questions from sections to a single list for the DB format
        let allQuestions = [];
        let totalMarks = 0;

        // Map sections to the flat structure used by ExamEngine
        Object.keys(testPaper.sections).forEach(subject => {
            const qs = testPaper.sections[subject];
            qs.forEach((q, idx) => {
                allQuestions.push({
                    id: allQuestions.length + 1, // Re-index for this specific test
                    original_id: q.id,
                    question: q.question,
                    options: q.options,
                    answer: q.answer,
                    explanation: q.explanation || "No explanation provided.",
                    subject: subject,
                    // mark: 4, // default
                    // negative: -1 // default
                });
                totalMarks += 4;
            });
        });

        // 3. Create Test Object
        const newTestId = `ai_gen_${Date.now()}`;

        // Metadata from the AI generation step (passed via frontend)
        const customTitle = testPaper.title || `AI Generated: Full Mock Test - ${new Date().toLocaleDateString()}`;
        const customType = testPaper.testType || "generated";
        const customDuration = testPaper.duration || 180;

        const newTest = {
            id: newTestId,
            title: customTitle,
            type: customType,
            status: "draft", // IMPORTANT: Draft by default
            duration: customDuration,
            totalMarks: totalMarks,
            instructions: "• AI Generated Test.\n• Negative marking applies.\n• Standard NEET pattern.",
            questions: allQuestions,
            createdAt: new Date().toISOString()
        };

        // 4. Append and Save
        if (!dbData.tests) dbData.tests = [];
        dbData.tests.push(newTest);

        fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));

        res.json({ ok: true, message: "Test saved successfully", testId: newTestId });

    } catch (error) {
        console.error("Save Test Error:", error);
        res.status(500).json({ ok: false, message: "Failed to save test" });
    }
};

module.exports = {
    generateTest,
    chatWithMentor,
    saveTest
};
