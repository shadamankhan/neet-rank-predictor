const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ping',
    method: 'GET',
    timeout: 2000 // 2 seconds
};

console.log('Testing connection to http://localhost:5000...');

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
    console.log('\n✅ Server is ALIVE.');
});

req.on('error', error => {
    console.error('\n❌ connection failed:', error.message);
    console.log('REASON: The backend server is NOT running.');
});

req.on('timeout', () => {
    req.destroy();
    console.error('\n❌ connection timed out');
});

req.end();
