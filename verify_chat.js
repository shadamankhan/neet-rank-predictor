const fs = require('fs');
const aiController = require('./backend/controllers/aiController');

const logBuffer = [];
const log = (...args) => {
    // console.log(...args); // omit console to focus on file
    logBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' '));
};

// Mock Req/Res
const mockRes = {
    json: (data) => log("Response:", data),
    status: (code) => ({ json: (data) => log(`Error ${code}:`, data) })
};

log("--- TEST 1: 'Generate a full mock test' ---");
aiController.chatWithMentor({ body: { message: "Generate a full mock test" } }, mockRes);

log("\n--- TEST 2: 'I want a physics test' ---");
aiController.chatWithMentor({ body: { message: "I want a physics test" } }, mockRes);

log("\n--- TEST 3: 'Hello' ---");
aiController.chatWithMentor({ body: { message: "Hello" } }, mockRes);

fs.writeFileSync('verify_chat_output.txt', logBuffer.join('\n'));
