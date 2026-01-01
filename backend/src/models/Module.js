const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "NEET 2026 Full Test Series"
    description: String,
    targetExam: { type: String, default: 'NEET' }, // NEET, JEE
    targetYear: Number, // 2026

    // Pricing & Access
    type: { type: String, enum: ['free', 'paid'], default: 'free' },
    price: Number,
    originalPrice: Number,

    // Visibility
    isPublished: { type: Boolean, default: false },

    // Structure: A module contains multiple tests
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],

    tags: [String], // e.g., "Class 11", "Droppers"
    metadata: {
        totalTests: { type: Number, default: 0 },
        totalStudents: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Module', ModuleSchema);
