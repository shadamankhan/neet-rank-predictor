require('dotenv').config();

// Require the canonical server implementation.
// backend/src/server.js creates the Express app and calls app.listen().
try {
    require('./src/server');
    console.log('Loaded ./src/server.js (canonical entry).');
} catch (err) {
    console.error("❌ Failed to start server:", err);
    // process.exit(1);
}
