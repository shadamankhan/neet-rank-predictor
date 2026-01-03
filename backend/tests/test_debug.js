const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const endpoints = [
    '/api/keralaprivate/all',
    '/api/karnataka/all',
    '/api/upprivate/all',
];

async function testEndpoints() {
    console.log(`Testing API Endpoints at ${BASE_URL}...`);

    for (const endpoint of endpoints) {
        try {
            console.log(`Fetching ${endpoint}...`);
            const res = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 2000 });
            console.log(`✅ ${endpoint}: Status ${res.status}`);
        } catch (err) {
            console.error(`❌ ${endpoint}: Failed`);
            if (err.response) {
                console.error(`   Status: ${err.response.status}`);
                console.error(`   Data:`, err.response.data);
            } else if (err.request) {
                console.error(`   No response received. Code: ${err.code}`);
                console.error(`   Message: ${err.message}`);
            } else {
                console.error(`   Error setting up request: ${err.message}`);
            }
        }
    }
}

testEndpoints();
