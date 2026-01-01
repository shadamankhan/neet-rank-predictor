const mongoose = require('mongoose');
const Module = require('../models/Module');
const Test = require('../models/Test');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neet-rank-predictor';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for Seeding');

        // 1. Create a Test Series Module
        // Check if exists first to avoid duplicates
        let demoModule = await Module.findOne({ title: "NEET 2026 Full Syllabus Series" });
        
        if (!demoModule) {
            console.log("Creating new Module...");
            demoModule = await Module.create({
                title: "NEET 2026 Full Syllabus Series",
                description: "Complete mock test series for NEET 2026 aspirants.",
                targetExam: "NEET",
                targetYear: 2026,
                type: "paid",
                price: 999,
                originalPrice: 2499,
                isPublished: true,
                tags: ["Class 12", "Dropper"]
            });
        } else {
            console.log("Module already exists:", demoModule.title);
        }

        // 2. Create a Test inside this Module
        const testTitle = "Review Test 01 - Physics";
        let demoTest = await Test.findOne({ title: testTitle, moduleId: demoModule._id });

        if (!demoTest) {
            console.log("Creating new Test...");
            demoTest = await Test.create({
                title: testTitle,
                moduleId: demoModule._id,
                type: "part",
                subjects: ["Physics"],
                duration: 60,
                totalMarks: 180,
                totalQuestions: 45,
                difficulty: "medium",
                contentSource: "question_bank", // For now
                schedule: {
                    startDate: new Date(), // Starts now
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
                },
                status: "live"
            });

            // Link test back to module
            demoModule.tests.push(demoTest._id);
            await demoModule.save();
        } else {
            console.log("Test already exists:", demoTest.title);
        }

        console.log("✅ Seeding Complete!");
        console.log("Module ID:", demoModule._id);
        console.log("Test ID:", demoTest._id);

        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        process.exit(1);
    }
};

seedData();
