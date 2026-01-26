const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ['student', 'admin', 'sub-admin'],
        default: 'student'
    },
    examProfile: {
        examType: { type: String, enum: ['NEET', 'AMU_11'], default: 'NEET' },
        targetYear: Number,
        currentClass: String // '9', '10', '11', '12'
    },
    subscription: {
        isPaid: { type: Boolean, default: false },
        activeModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }], // List of purchased modules
        expiryDate: Date
    },
    stats: {
        testsAttempted: { type: Number, default: 0 },
        avgAccuracy: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
