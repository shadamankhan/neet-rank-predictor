// src/server.js
const express = require('express');
const admin = require('firebase-admin');
const mongoose = require('mongoose'); // Import mongoose
const cors = require('cors'); // Import cors
const adminAuth = require('./middleware/adminAuth');
const adminExportRouter = require('./routes/adminExport');
const { loadAllDistributionsOnStartup, startWatcher } = require('./predictCache');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin using centralized wrapper
const firebaseAdminWrapper = require('../firebaseAdmin');
if (!firebaseAdminWrapper.isInitialized && !firebaseAdminWrapper.initError) {
  // If wrapper didn't auto-init, we can't do much, but it logs errors.
  console.warn("Server warning: Firebase Admin not fully initialized check ../firebaseAdmin.js logs.");
}

// Health Check Root
app.get('/', (req, res) => {
  res.send('Backend is Running');
});

// Enable CORS for frontend (Debugging Mode - Permissive)
const corsOptions = {
  origin: true, // Allow all origins explicitly
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};

app.use(cors(corsOptions));

// Explicit OPTIONS handling for preflight requests with SAME options
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' })); // Increased limit for larger uploads

// Security Headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next(); // Important
});

console.log("✅ CORS enabled for http://localhost:5173");

// Serve Quizzes Static Directory (PDFs)
const path = require('path');
app.use('/data/quizzes', express.static(path.join(__dirname, '../data/quizzes')));
console.log("📂 Serving Static PDFs at /data/quizzes");

// Public API (example)
app.get('/api/ping', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

const predictRouter = require('./routes/predict');
const savePredictionRouter = require('./routes/savePrediction');
const adminUploadRouter = require('./routes/adminUpload');
const historyRouter = require('./routes/history');

console.log("Mounting routes...");
app.use('/api/predict', predictRouter);
app.use('/api/history', historyRouter);
app.use('/api', savePredictionRouter);

const collegeFinderRouter = require('./routes/collegeFinder');
app.use('/api/colleges', collegeFinderRouter);

const deemedRouter = require('./routes/deemed');
app.use('/api/deemed', deemedRouter);

const karnatakaRouter = require('./routes/karnataka');
app.use('/api/karnataka', karnatakaRouter);

const upPrivateRouter = require('./routes/upprivate');
app.use('/api/upprivate', upPrivateRouter);

const keralaPrivateRouter = require('./routes/keralaprivate');
app.use('/api/keralaprivate', keralaPrivateRouter);

const biharPrivateRouter = require('./routes/biharprivate');
app.use('/api/biharprivate', biharPrivateRouter);

const haryanaPrivateRouter = require('./routes/haryanaprivate');
app.use('/api/haryanaprivate', haryanaPrivateRouter);

const westBengalPrivateRouter = require('./routes/westbengalprivate');
app.use('/api/westbengalprivate', westBengalPrivateRouter);

const andhraPradeshRouter = require('./routes/andhrapradesh');
app.use('/api/andhrapradesh', andhraPradeshRouter);

const tamilNaduRouter = require('./routes/tamilnadu');
app.use('/api/tamilnadu', tamilNaduRouter);

const adminDataRouter = require('./routes/adminData');
app.use('/api/admin/data', adminDataRouter);

const analyticsRouter = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRouter);

const statsRouter = require('./routes/statsRoutes');
app.use('/api/stats', statsRouter);

const queriesRouter = require('./routes/queries');
app.use('/api/queries', queriesRouter);

const userStatsRouter = require('./routes/userStats');
app.use('/api/user', userStatsRouter);

const chemistryPyqRouter = require('../routes/chemistryPyq');
app.use('/api/chemistry-pyq', chemistryPyqRouter);

const physicsPyqRouter = require('../routes/physicsPyq');
app.use('/api/physics-pyq', physicsPyqRouter);

const testSeriesRouter = require('../routes/testSeries');
app.use('/api/test-series', testSeriesRouter);

const questionBankRouter = require('../routes/questionBank');
app.use('/api/question-bank', questionBankRouter);

const studentsRouter = require('../routes/students');
app.use('/api/students', studentsRouter);

const aiRoutes = require('../routes/aiRoutes');
app.use('/api/ai', aiRoutes);



console.log("Routes mounted.");

// Admin-protected routes under /api/admin
const adminQuizRouter = require('../routes/adminQuiz');
app.use('/api/admin/quiz', adminAuth, adminQuizRouter); // Protected by Admin Auth

app.use('/api/admin', adminAuth, adminExportRouter);
app.use('/api/admin', adminAuth, adminUploadRouter);

// 404 Handler for debugging
app.use((req, res, next) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ ok: false, message: 'Endpoint not found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// Start Server with Cache Initialization
(async () => {
  try {
    console.log("🔄 Initializing Prediction Cache...");

    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neet-rank-predictor';
    try {
      await mongoose.connect(MONGO_URI);
      console.log(`✅ MongoDB Connected: ${MONGO_URI}`);
    } catch (mongoErr) {
      console.error("❌ MongoDB Connection Error:", mongoErr);
    }

    try {
      await loadAllDistributionsOnStartup();
      startWatcher();
      console.log("✅ Prediction Cache Loaded & Watcher Started");
    } catch (cacheErr) {
      console.error("⚠️ Prediction Cache Init Failed:", cacheErr.message);
    }

    app.listen(PORT, () => {
      console.log(`\n✅ SERVER CONNECTED | PORT ${PORT} | VERSION: [ V5-UNIFIED-SERVER ]`);
      console.log(`   History API: http://localhost:${PORT}/api/history`);
      console.log(`   Predict API: http://localhost:${PORT}/api/predict`);
      console.log(`   Admin Export: http://localhost:${PORT}/api/admin/export\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

// Force Restart Trigger 1
