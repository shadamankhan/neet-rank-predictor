const fs = require('fs');
const testGenerator = require('./backend/services/testGenerator');

const logBuffer = [];
const log = (...args) => {
    console.log(...args);
    logBuffer.push(args.join(' '));
};

log("Starting Verification of AI Test Generator...");

// 1. mock constraints
const constraints = {
    subjectDistribution: {
        Physics: 5,
        Chemistry: 5,
        Biology: 10
    }
};

try {
    const start = Date.now();
    const result = testGenerator.generateTest(constraints);
    const duration = Date.now() - start;

    log(`\nGeneration took ${duration}ms`);
    log(`Test ID: ${result.test_id}`);

    // Check counts
    const phyCount = result.sections.Physics.length;
    const chemCount = result.sections.Chemistry.length;
    const bioCount = result.sections.Biology.length;

    log(`Physics: ${phyCount} / 5`);
    log(`Chemistry: ${chemCount} / 5`);
    log(`Biology: ${bioCount} / 10`);

    if (phyCount === 5 && chemCount === 5 && bioCount === 10) {
        log("\n✅ COUNT CHECK PASSED");
    } else {
        log("\n❌ COUNT CHECK FAILED");
    }

    // Check structure
    const sampleQ = result.sections.Physics[0];
    if (sampleQ && sampleQ.id && sampleQ.question && sampleQ.options && sampleQ.answer !== undefined) {
        log("✅ QUESTION STRUCTURE CHECK PASSED");
        log("Sample Question ID:", sampleQ.id);
        log("Sample Difficulty:", sampleQ.difficulty);
    } else {
        log("❌ QUESTION STRUCTURE CHECK FAILED", JSON.stringify(sampleQ));
    }

} catch (e) {
    log("❌ CRTICAL ERROR:", e.message);
} finally {
    fs.writeFileSync('verify_output.txt', logBuffer.join('\n'));
}
