const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/generate', aiController.generateTest);
router.post('/chat', aiController.chatWithMentor);
router.post('/save', aiController.saveTest);

module.exports = router;
