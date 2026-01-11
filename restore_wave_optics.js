const fs = require('fs');
const path = require('path');
const questionsFile = './backend/data/quizzes/physics/Wave Optics.json';
const dbFile = './backend/data/test_series_db.json';

try {
    const questionsData = fs.readFileSync(questionsFile, 'utf8');
    const questions = JSON.parse(questionsData);

    const dbData = fs.readFileSync(dbFile, 'utf8');
    const db = JSON.parse(dbData);

    // Check if already exists to prevent duplicate
    const exists = db.tests.find(t => t.title.includes('Wave Optics'));
    if (exists) {
        console.log('Test already exists:', exists.id, exists.title);
        // Optional: Update questions if needed
    } else {
        const newTest = {
            id: "mjqs_wave_optics_" + Date.now(), // Generate a unique ID
            title: "NEET 2026 – Physics – wave optics – Chapter Test – 01",
            type: "free", // Or "chapter"? Screenshot 1 showed it in Chapter Tests. But my list implies "free" maps to free. Wait.
            // Screenshot 1 has "Chapter Tests" selected. And card says "NEET 2026 - Physics...".
            // In my previous list, Index 10 was 'chapter'.
            // Let's set type to 'chapter' to be safe, or 'free' if it is free.
            // Screenshot 1 says "FREE" in green. 
            // 'free' category ID means type='free' usually.
            // But 'Chapter Tests' category also exists.
            // If I set type='chapter', it shows in Chapter Tests.
            // If I set type='free', it shows in Free Tests.
            // The user screenshot 2 shows "Chapter Tests" tab selected.
            // So it MUST be appearing in Chapter Tests.
            // So type should be 'chapter'.
            // But it says "FREE" on the card.
            // Price field controls that.
            // Let's use type="chapter".
            type: "chapter",
            duration: 180,
            totalMarks: questions.length * 4,
            instructions: "• Chapter-wise Test strictly based on NCERT.\n• Questions are selected as per NEET examination pattern.\n• Negative marking is applicable.",
            questions: questions,
            startDate: new Date().toISOString(),
            endDate: null,
            price: 0,
            isPremium: false,
            status: "Live",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.tests.push(newTest);
        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
        console.log('Restored Wave Optics test:', newTest.id);
    }

} catch (e) {
    console.error(e);
}
