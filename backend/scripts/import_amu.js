const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Question = require('../src/models/Question');
const Test = require('../src/models/Test');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const importAMU = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neet-rank-predictor';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const jsonPath = path.join(__dirname, '../../amu-frontend/src/data/amu_test_content.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);
        const testData = data.test;

        console.log(`Processing Test: ${testData.title}`);

        const questionIds = [];

        for (const q of testData.questions) {
            const newQ = new Question({
                statement: q.statement,
                type: 'mcq',
                options: q.options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    isCorrect: opt.isCorrect
                })),
                tags: {
                    subject: q.tags.subject,
                    difficulty: 'medium',
                    source: 'AMU Entrance Mock 1'
                }
            });

            const savedQ = await newQ.save();
            questionIds.push(savedQ._id);
            console.log(`Saved Question: ${savedQ._id} (${q.tags.subject})`);
        }

        const newTest = new Test({
            title: testData.title,
            category: 'AMU_11', // Custom category
            type: 'mock',
            duration: testData.duration || 120,
            totalMarks: testData.totalMarks || 100,
            totalQuestions: questionIds.length,
            questionIds: questionIds,
            status: 'live',
            contentSource: 'question_bank',
            schedule: {
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            },
            subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Indo-Islamic Culture']
        });

        const savedTest = await newTest.save();
        console.log(`✅ Test Created Successfully: ${savedTest._id}`);
        console.log(`   Title: ${savedTest.title}`);
        console.log(`   Total Questions: ${savedTest.totalQuestions}`);

    } catch (err) {
        console.error('❌ Import Failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit();
    }
};

importAMU();
