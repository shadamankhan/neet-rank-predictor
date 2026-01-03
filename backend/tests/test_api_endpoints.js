const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const endpoints = [
    '/api/keralaprivate/all',
    '/api/karnataka/all',
    '/api/upprivate/all',
    '/api/tamilnadu/all',
    '/api/deemed/all',
    '/api/westbengalprivate/all',
    '/api/haryanaprivate/all',
    '/api/biharprivate/all',
    '/api/andhrapradesh/all'
];

async function testEndpoints() {
    console.log('Testing API Endpoints...');
    let passed = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
        try {
            const res = await axios.get(`${BASE_URL}${endpoint}`);
            if (res.status === 200 && res.data.ok) {
                console.log(`✅ ${endpoint}: OK (${res.data.count || res.data.data?.length || 0} items)`);
                passed++;
            } else {
                console.error(`❌ ${endpoint}: Failed (Status: ${res.status}, OK: ${res.data.ok})`);
                failed++;
            }
        } catch (err) {
            console.error(`❌ ${endpoint}: Error - ${err.message}`);
            if (err.response) {
                console.error(`   Status: ${err.response.status}`);
                console.error(`   Data:`, err.response.data);
            }
            failed++;
        }
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

testEndpoints();
