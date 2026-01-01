/**
 * backend/server.js
 * Bootstrap that loads the canonical server implementation in ./src/server.js
 * This file simply requires the real server which already starts listening.
 * We keep this lightweight to avoid recursion and to have a single canonical entry.
 */
require('dotenv').config();

// Require the canonical server implementation.
// backend/src/server.js creates the Express app and calls app.listen().
require('./src/server');

console.log('Loaded ./src/server.js (canonical entry).');
