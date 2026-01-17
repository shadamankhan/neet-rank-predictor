const express = require('express');
const router = express.Router();
const Question = require('../src/models/Question');

// GET single question
router.get('/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ ok: false, message: 'Question not found' });
        res.json({ ok: true, question });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// PUT update question (Fix formatting, typos, etc.)
router.put('/:id', async (req, res) => {
    try {
        const { statement, options, explanation, tags } = req.body;
        const updateData = {};

        if (statement) updateData.statement = statement;
        if (options) updateData.options = options;
        if (explanation) updateData.explanation = explanation;
        if (tags) updateData.tags = tags;

        // Use findByIdAndUpdate with new: true to return updated doc
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ ok: false, message: 'Question not found' });
        }

        res.json({ ok: true, message: 'Question updated successfully', question: updatedQuestion });
    } catch (err) {
        console.error("Update question error:", err);
        res.status(500).json({ ok: false, message: 'Failed to update question: ' + err.message });
    }
});

module.exports = router;
