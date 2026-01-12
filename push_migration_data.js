const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, 'backend/data/test_series_db.json');

if (!fs.existsSync(DATA_FILE)) {
    console.error("DATA FILE NOT FOUND LOCALLY");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const tests = data.tests || [];

console.log(`Found ${tests.length} tests to migrate.`);

const payload = JSON.stringify({ tests });

const options = {
    hostname: 'neet-rank-predictor-backend.onrender.com',
    path: '/api/test-series/migrate-legacy',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(payload);
req.end();
