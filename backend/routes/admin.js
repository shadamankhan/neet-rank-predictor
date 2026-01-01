// backend/routes/admin.js
/**
 * Express router for admin endpoints (upload-distribution).
 * - multer fileSize limit
 * - JSON schema validation with AJV
 * - robust error handling for multer / validation
 * - invalidates predict cache after successful upload
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin'); // used in verifyAdmin
const Ajv = require('ajv');

console.log('ℹ️ loading routes/admin.js (with AJV + file limits)');

// Require predict router instance so we can invalidate its cache (same module instance)
let predictRouter = null;
try {
  predictRouter = require('./predict');
  console.log('ℹ️ admin: predict router required successfully.');
} catch (err) {
  console.warn('⚠️ admin: failed to require predict router (cache invalidation disabled):', err && err.message ? err.message : err);
}

// ----------------------
// Multer (memory) with limits
// ----------------------
const MAX_FILE_BYTES = process.env.ADMIN_UPLOAD_MAX_BYTES
  ? Number(process.env.ADMIN_UPLOAD_MAX_BYTES)
  : 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES }
});

// ----------------------
// AJV JSON schema for distribution
// ----------------------
const ajv = new Ajv({ allErrors: true, useDefaults: true });

const distributionSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["score", "count"],
    properties: {
      score: { type: "number", minimum: 0, maximum: 720 },
      count: { type: "number", minimum: 0 }
    },
    additionalProperties: false
  }
};

const validateDistribution = ajv.compile(distributionSchema);

// ----------------------
// verifyAdmin middleware
// ----------------------
async function verifyAdmin(req, res, next) {
  try {
    const devKey = process.env.ADMIN_KEY || 'changeme';
    const incomingKey = (req.get('x-admin-key') || '').trim();

    if (incomingKey) {
      if (incomingKey === devKey) {
        req.adminVerified = { method: 'dev-key' };
        return next();
      }
      return res.status(401).json({ ok: false, message: 'Invalid x-admin-key' });
    }

    const authHeader = (req.get('authorization') || '').trim();
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Missing idToken' });
    }

    const idToken = authHeader.split(' ')[1] && authHeader.split(' ')[1].trim();
    if (!idToken) {
      return res.status(401).json({ ok: false, message: 'Missing idToken' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded && decoded.admin === true) {
      req.adminVerified = { method: 'firebase', uid: decoded.uid };
      return next();
    }
    return res.status(403).json({ ok: false, message: 'User is not an admin (missing admin claim).' });
  } catch (err) {
    console.error('verifyAdmin error:', err && err.message ? err.message : err);
    return res.status(401).json({ ok: false, message: 'Invalid idToken or auth error' });
  }
}

// ----------------------
// TEMP ping
// ----------------------
router.get('/ping', (req, res) => res.json({ ok: true, route: '/admin/ping' }));

// ----------------------
// Upload distribution handler
// ----------------------
router.post(
  '/upload-distribution',
  upload.single('file'),
  verifyAdmin,
  async (req, res) => {
    try {
      const dataset = req.body.dataset;
      const year = req.body.year;
      const file = req.file;

      if (!dataset || !year) {
        return res.status(400).json({ ok: false, message: 'Missing dataset or year in form data.' });
      }
      if (!file) {
        return res.status(400).json({ ok: false, message: 'Missing file upload (field name "file").' });
      }
      if (dataset !== 'distribution') {
        return res.status(422).json({ ok: false, message: 'This endpoint only accepts dataset=distribution.' });
      }

      const jsonStr = file.buffer.toString('utf8');
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        return res.status(400).json({ ok: false, message: 'Uploaded file is not valid JSON.' });
      }

      // ---- Normalize & Validate ----
      let bucketsToValidate = null;
      const savePayload = parsed; // save original shape

      if (Array.isArray(parsed)) {
        bucketsToValidate = parsed;
      } else if (parsed && Array.isArray(parsed.buckets)) {
        bucketsToValidate = parsed.buckets;
      } else {
        return res.status(400).json({
          ok: false,
          message: 'Uploaded JSON must be either an array of {score,count} or an object with a buckets array.'
        });
      }

      const isValid = validateDistribution(bucketsToValidate);
      if (!isValid) {
        const errors = (validateDistribution.errors || []).map(e => ({
          instancePath: e.instancePath,
          message: e.message,
          params: e.params
        }));
        return res.status(400).json({ ok: false, message: 'JSON schema validation failed.', errors });
      }

      // Save to backend/data/distribution_<year>.json
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      const outPath = path.join(dataDir, `distribution_${String(year)}.json`);
      fs.writeFileSync(outPath, JSON.stringify(savePayload, null, 2), 'utf8');

      // --- invalidate predict router cache for this year (best-effort)
      try {
        if (predictRouter && typeof predictRouter.invalidateDistributionCache === 'function') {
          predictRouter.invalidateDistributionCache(year);
          console.log(`✅ admin: invalidated predict cache for year ${year}`);
        } else if (predictRouter && typeof predictRouter.invalidateAllDistributionCache === 'function') {
          predictRouter.invalidateAllDistributionCache();
          console.log('✅ admin: invalidated entire predict cache (fallback)');
        } else {
          console.warn('⚠️ admin: predict invalidate function not available; skipping invalidation');
        }
      } catch (err) {
        console.error('❌ admin: error invalidating predict cache:', err && err.stack ? err.stack : err);
      }

      // optional app reload hook
      if (req.app && typeof req.app.reloadDistributions === 'function') {
        try { req.app.reloadDistributions(year); } catch (e) { console.warn('reloadDistributions failed', e); }
      }

      return res.json({
        ok: true,
        message: 'Distribution uploaded',
        path: outPath,
        adminVerified: req.adminVerified
      });
    } catch (err) {
      console.error('/admin/upload-distribution error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
  }
);

// ----------------------
// Multer / upload error handler
// ----------------------
router.use((err, req, res, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ ok: false, message: `Uploaded file too large. Max ${MAX_FILE_BYTES} bytes.` });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, message: err.message || 'Upload error' });
  }
  console.error('Unhandled error in admin router:', err && (err.stack || err));
  return res.status(500).json({ ok: false, message: 'Internal server error' });
});

module.exports = router;
