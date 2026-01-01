// backend/src/routes/admin.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { verifyIdToken } = require('../firebaseAdmin');
const { loadDistributionFromFile, importDistribution } = require('../predictCache');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/**
 * POST /admin/upload-distribution
 * headers: Authorization: Bearer <idToken>
 * form: file=<file>, year=<YYYY> (year optional if file JSON contains year)
 */
router.post('/upload-distribution', upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await verifyIdToken(token);
    // Optional: check for admin claim
    if (!user || !(user.admin === true || user.firebase?.sign_in_provider)) {
      // Replace check with your custom claim name, e.g., user.admin === true
      // If you use custom claims, do: if (!user.admin) return 403
    }
    if (!req.file) return res.status(400).json({ ok: false, message: 'file missing' });
    const year = req.body.year || null;
    // write file to temp path in data dir
    const originalName = req.file.originalname;
    const tmpName = `upload_${Date.now()}_${originalName}`;
    const tmpPath = path.join(__dirname, '..', 'data', tmpName);
    await fs.writeFile(tmpPath, req.file.buffer);
    // parse file (CSV or JSON)
    const parsed = await loadDistributionFromFile(tmpPath);
    // clean tmp file
    await fs.unlink(tmpPath);
    // if parsed has no buckets and file was csv without columns, throw
    if (!parsed || !parsed.buckets || !parsed.buckets.length) {
      return res.status(400).json({ ok: false, message: 'Parsed distribution invalid or empty' });
    }
    // import into canonical file distribution_<year>.json
    const result = await importDistribution(parsed, year);
    return res.json({ ok: true, message: 'Uploaded and imported', year: result?.year || year });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
