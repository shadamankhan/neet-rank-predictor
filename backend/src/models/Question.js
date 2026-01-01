const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    type: { type: String, enum: ['mcq', 'integer', 'match', 'assertion'], default: 'mcq' },

    // Content
    statement: { type: String, required: true }, // Markdown or HTML
    images: [String], // URLs

    options: [{
        id: Number, // 1, 2, 3, 4
        text: String,
        image: String,
        isCorrect: Boolean
    }],

    // Solution
    explanation: String,
    solutionImage: String,

    // Meta-data for Analytics
    tags: {
        subject: { type: String, index: true }, // Physics
        chapter: String, // Thermodynamics
        topic: String,   // First Law
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        source: String   // e.g., "NEET 2021 PYQ"
    },

    stats: {
        timesUsed: { type: Number, default: 0 },
        correctAttempts: { type: Number, default: 0 },
        totalAttempts: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
