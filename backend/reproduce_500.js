const mongoose = require('mongoose');
const Test = require('./src/models/Test');

const MONGO_URI = 'mongodb://127.0.0.1:27017/neet-rank-predictor';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const tests = await Test.find({ status: { $in: ['live', 'scheduled'] } });
        console.log(`Found ${tests.length} tests`);

        const testBundles = {
            free: [],
            chapter: [],
            part: [],
            full: [],
            pyq: []
        };

        const typeMap = {
            'mock': 'full',
            'chapter': 'chapter',
            'part': 'part',
            'pyq': 'pyq',
            'free': 'free'
        };

        tests.forEach((t, i) => {
            try {
                // console.log(`Processing test ${i}: ${t._id} - ${t.title}`);
                const catId = typeMap[t.type] || t.type || 'free';
                if (!testBundles[catId]) testBundles[catId] = [];

                testBundles[catId].push({
                    id: t._id,
                    title: t.title,
                    questions: t.totalQuestions,
                    time: t.duration,
                    price: t.price > 0 ? t.price : 'Free',
                    status: t.status === 'live' ? 'Open' : 'Locked',
                    isPremium: t.isPremium,
                    date: t.schedule?.startDate ? new Date(t.schedule.startDate).toLocaleDateString() : 'TBA'
                });
            } catch (err) {
                console.error(`Error processing test in loop ${t._id}:`, err);
            }
        });

        // Find upcoming test
        const upcoming = await Test.findOne({
            'schedule.startDate': { $gt: new Date() }
        }).sort({ 'schedule.startDate': 1 });

        console.log("Upcoming test query done.");
        if (upcoming) console.log("Upcoming found:", upcoming._id);

        const upcomingTest = upcoming ? {
            id: upcoming._id,
            title: upcoming.title,
            date: new Date(upcoming.schedule.startDate).toLocaleDateString(),
            timeLeft: 'Coming Soon',
            topics: upcoming.subjects?.join(', ') || 'General',
            participants: 1200
        } : null;

        console.log("Upcoming processed successfully.");

        console.log("DONE. No crash.");

    } catch (err) {
        console.error("CRASHED:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
