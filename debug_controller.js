const tutorialController = require('./backend/controllers/tutorialController');

console.log('Keys in tutorialController:', Object.keys(tutorialController));
console.log('uploadVoice type:', typeof tutorialController.uploadVoice);

if (typeof tutorialController.uploadVoice === 'undefined') {
    console.error('FAIL: uploadVoice is undefined');
} else {
    console.log('PASS: uploadVoice is defined');
}
