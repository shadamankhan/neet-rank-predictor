const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Minor Test 04 - Physics"
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },

    // Test Configuration
    type: { type: String, enum: ['full', 'part', 'chapter', 'pyq'], required: true },
    subjects: [String], // ["Physics", "Chemistry"]
    duration: { type: Number, default: 180 }, // in minutes
    totalMarks: { type: Number, default: 720 },
    totalQuestions: { type: Number, default: 180 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'neet-level'] },

    // Content Source (The 3 Options)
    contentSource: {
        type: String,
        enum: ['question_bank', 'file_upload', 'json_upload'],
        required: true
    },

    // OPTION A: Linked Questions (from Question Bank)
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

    // OPTION B: File Links (for PDF based tests)
    files: {
        questionPaper: { type: String }, // URL to PDF
        answerKey: { type: String },     // URL to PDF
        solutions: { type: String }      // URL to PDF
    },

    // Scheduling
    schedule: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        resultPublishDate: Date, // Can be auto
        flexibility: {
            canResume: { type: Boolean, default: false },
            lateJoiningWindow: { type: Number, default: 15 } // minutes
        }
    },

    status: { type: String, enum: ['draft', 'scheduled', 'live', 'ended'], default: 'draft' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', TestSchema);
