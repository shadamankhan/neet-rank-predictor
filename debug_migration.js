const https = require('https');

const options = {
    hostname: 'neet-rank-predictor-backend.onrender.com',
    path: '/api/test-series/migrate-legacy',
    method: 'POST',
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

req.end();
