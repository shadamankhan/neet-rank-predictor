const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'image', 'json', 'other'], default: 'other' },
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    linkedTo: {
        module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
        test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
