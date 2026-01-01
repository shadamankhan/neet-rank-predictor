const { getPrediction } = require('./src/utils/newPredictor');

console.log("Testing new predictor logic...");

const scores = [720, 715, 650, 600, 500, 400];

scores.forEach(s => {
    const res = getPrediction(s);
    if (res) {
        console.log(`\nScore: ${s}`);
        console.log(`2025: ${JSON.stringify(res.y2025)}`);
        console.log(`2024: ${JSON.stringify(res.y2024)}`);
        // Check interpolation
        if (res.interpolated) console.log("Status: Interpolated");
    } else {
        console.log(`\nScore: ${s} -> NO DATA`);
    }
});
