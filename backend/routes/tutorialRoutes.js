const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const tutorialController = require('../controllers/tutorialController');

// Multer Config
const upload = multer({
    dest: path.join(__dirname, '../data/temp_uploads'), // Temp dir
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Routes
router.post('/upload-screen', upload.single('screenVideo'), tutorialController.uploadScreen);
router.post('/generate-script', tutorialController.generateScript);
router.post('/generate-voice', tutorialController.generateVoice); // Unified for AI
router.post('/upload-voice', upload.single('voiceAudio'), tutorialController.uploadVoice);
router.post('/sync', tutorialController.syncTutorial);

module.exports = router;
