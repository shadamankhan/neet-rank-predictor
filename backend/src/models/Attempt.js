const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },

    startTime: Date,
    submitTime: Date,
    status: { type: String, enum: ['ongoing', 'completed', 'abandoned'] },

    // Main Score
    score: Number,
    rank: Number,
    accuracy: Number,
    percentile: Number,

    // Granular Question Analysis
    responses: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: Number, // null if unattempted
        isCorrect: Boolean,
        timeTaken: Number, // seconds
        status: { type: String, enum: ['correct', 'incorrect', 'unattempted', 'marked'] }
    }],

    // Subject-wise Breakdown
    sectionAnalysis: {
        Physics: {
            score: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 }
        },
        Chemistry: {
            score: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 }
        },
        Botany: {
            score: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 }
        },
        Zoology: {
            score: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 }
        },
        General: { // Fallback
            score: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 }
        }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attempt', AttemptSchema);
