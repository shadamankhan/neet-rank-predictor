// backend/src/routes/adminUpload.js
/**
 * Express router for admin endpoints (upload-distribution, list, delete).
 * - multer fileSize limit
 * - JSON schema validation with AJV
 * - robust error handling for multer / validation
 * - reloads/clears predict cache
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const Ajv = require('ajv');
const { loadYearToCache, listCachedYears, deleteYear } = require('../predictCache');
const { parse } = require('csv-parse/sync');

console.log('ℹ️ loading routes/adminUpload.js (plus list/delete)');

// ----------------------
// Multer (memory) with limits
// ----------------------
const MAX_FILE_BYTES = process.env.ADMIN_UPLOAD_MAX_BYTES
  ? Number(process.env.ADMIN_UPLOAD_MAX_BYTES)
  : 50 * 1024 * 1024; // 50MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES }
});

// ----------------------
// AJV JSON schema for distribution
// ----------------------
const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });

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
    // Allow any valid user for now (or strictly check admin claim)
    req.adminVerified = { method: 'firebase', uid: decoded.uid };
    return next();
  } catch (err) {
    console.error('verifyAdmin error:', err && err.message ? err.message : err);
    return res.status(401).json({ ok: false, message: 'Invalid idToken or auth error' });
  }
}

// ----------------------
// Public Endpoints
// ----------------------
// Allow frontend to list years without admin auth (dropdowns)
router.get('/list-years', (req, res) => {
  try {
    const years = listCachedYears().map(Number);
    return res.json({ ok: true, years });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ----------------------
// Admin Protected Endpoints
// ----------------------

// LIST detailed info (if needed differently than public, otherwise same)
router.get('/distributions', verifyAdmin, (req, res) => {
  try {
    const years = listCachedYears();
    // In future could return metadata like file size, last modified, etc.
    // For now returning list of years is sufficient to show what is loaded.
    return res.json({ ok: true, years });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE a year
router.delete('/distributions/:year', verifyAdmin, async (req, res) => {
  try {
    const year = req.params.year;
    if (!year) return res.status(400).json({ ok: false, message: 'Missing year' });

    await deleteYear(year);
    return res.json({ ok: true, message: `Deleted distribution for ${year}` });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// UPLOAD overwrite
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
      let isCsv = false;

      // Try JSON first
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        // Not JSON, try CSV
        try {
          parsed = parse(jsonStr, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: true
          });
          isCsv = true;

          // Transform/Validate CSV rows to ensure they match {score, count} structure
          if (Array.isArray(parsed)) {
            parsed = parsed.map(row => {
              // Flexible key matching (case-insensitive) if needed, OR strict
              // For now, assuming headers are "score" and "count"
              let s = row.score;
              let c = row.count;

              // If keys are missing (capitalized?), try fallback
              if (s === undefined && row.Score !== undefined) s = row.Score;
              if (c === undefined && row.Count !== undefined) c = row.Count;

              return {
                score: Number(s),
                count: Number(c)
              };
            });
          }

        } catch (csvErr) {
          return res.status(400).json({ ok: false, message: 'Uploaded file is not valid JSON or CSV.' });
        }
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

      // Optional: Relaxed validation or log errors instead of reject if data is slightly messy
      const isValid = validateDistribution(bucketsToValidate);
      if (!isValid) {
        console.warn("Validation warning for upload:", validateDistribution.errors);
        const errors = (validateDistribution.errors || []).map(e => ({
          instancePath: e.instancePath,
          message: e.message
        }));
        return res.status(400).json({ ok: false, message: 'JSON schema validation failed.', errors });
      }

      // Save to backend/data/distribution_<year>.json
      const dataDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      const outPath = path.join(dataDir, `distribution_${String(year)}.json`);
      fs.writeFileSync(outPath, JSON.stringify(savePayload, null, 2), 'utf8');

      // --- Reload Cache ---
      try {
        await loadYearToCache(year);
        console.log(`✅ admin: Reloaded cache for year ${year}`);
      } catch (err) {
        console.error('❌ admin: error reloading cache:', err);
      }

      return res.json({
        ok: true,
        message: 'Distribution uploaded and cached',
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
