// Mock testGenerator
const mockTestGenerator = {
    generateTest: () => ({ test_id: 'MOCK_ID', sections: {} })
};

// Mock require to intercept testGenerator loading
const originalRequire = require;
require = (path) => {
    if (path.includes('testGenerator')) return mockTestGenerator;
    return originalRequire(path);
};

const aiController = require('./backend/controllers/aiController');

// Mock Req/Res
const mockRes = {
    json: (data) => console.log(JSON.stringify(data)),
    status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
};

console.log("TEST_START");
aiController.chatWithMentor({ body: { message: "Generate a full mock test" } }, mockRes);
console.log("TEST_END");
