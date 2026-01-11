const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
const result = require('dotenv').config({ path: envPath });

console.log('Debig: Env Path:', envPath);
if (result.error) {
    console.error('Debug: Dotenv Error:', result.error.message);
} else {
    console.log('Debug: Dotenv parsed keys:', Object.keys(result.parsed || {}));
}

console.log('Debug: MONGO_URI is:', process.env.MONGO_URI ? 'Set' : 'Unset');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neet-rank-predictor';
        console.log('Connecting to:', uri.includes('@') ? 'Remote Atlas' : uri);
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }
};

const migrate = async () => {
    await connectDB();

    if (!fs.existsSync(JSON_DB_PATH)) {
        console.error('❌ JSON DB file not found:', JSON_DB_PATH);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
    const { tests = [] } = data;

    console.log(`🔍 Found ${tests.length} tests to migrate...`);

    for (const testData of tests) {
        try {
            // Check if test already exists (by title, preventing duplicates)
            const exists = await Test.findOne({ title: testData.title });
            if (exists) {
                console.log(`⚠️ Test "${testData.title}" already exists. Skipping.`);
                continue;
            }

            // 1. Process Questions
            const questionIds = [];
            if (testData.questions && testData.questions.length > 0) {
                for (const q of testData.questions) {
                    // Create Question Document
                    const newQ = new Question({
                        statement: q.question,
                        type: 'mcq', // Default
                        options: (q.options || []).map((opt, idx) => ({
                            id: idx, // 0, 1, 2, 3
                            text: opt,
                            isCorrect: idx === parseInt(q.answer)
                        })),
                        explanation: q.explanation,
                        tags: {
                            subject: q.subject || 'General'
                        }
                    });
                    const savedQ = await newQ.save();
                    questionIds.push(savedQ._id);
                }
            }

            // 2. Map Status
            let status = 'draft';
            if (testData.status === 'Live') status = 'live';
            if (testData.status === 'Locked') status = 'live'; // Or scheduled? default to live for visibility

            // 3. Create Test Document
            const newTest = new Test({
                title: testData.title,
                type: testData.type || 'free', // Map types if needed
                duration: testData.duration || 180,
                totalMarks: testData.totalMarks || 720,
                totalQuestions: testData.questions?.length || 0,
                questionIds: questionIds,
                contentSource: 'question_bank', // Since we migrated questions
                schedule: {
                    startDate: testData.startDate ? new Date(testData.startDate) : new Date(),
                    endDate: testData.endDate ? new Date(testData.endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                },
                price: testData.price === 'Free' ? 0 : (parseInt(testData.price) || 0),
                isPremium: testData.isPremium || false,
                status: status
            });

            await newTest.save();
            console.log(`✅ Migrated: ${testData.title} (${questionIds.length} Qs)`);

        } catch (err) {
            console.error(`❌ Failed to migrate "${testData.title}":`, err.message);
        }
    }

    console.log('🎉 Migration Complete!');
    process.exit(0);
};

migrate();
