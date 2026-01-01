// backend/routes/savePrediction.js (Firestore-only)
const express = require('express');
const router = express.Router();
const firebaseAdmin = require('../firebaseAdmin');
const admin = firebaseAdmin.admin;
const firestore = admin ? admin.firestore() : null;

function extractIdTokenFromReq(req) {
  const authHeader = req.get('Authorization') || req.get('authorization') || '';
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  if (req.body && req.body.idToken) return req.body.idToken;
  return null;
}

router.post('/savePrediction', async (req, res) => {
  try {
    if (!firebaseAdmin.isInitialized || !admin) {
      return res.status(500).json({ ok: false, message: 'Server misconfigured: Firebase Admin not initialized.' });
    }

    const idToken = extractIdTokenFromReq(req);
    if (!idToken) return res.status(401).json({ ok: false, message: 'Missing idToken' });

    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken); } 
    catch (err) {
      return res.status(401).json({ ok: false, message: 'Invalid or expired idToken' });
    }

    const { year, score, percentile, predictedRank, rankRange, method, totalCount } = req.body || {};
    if (typeof year === 'undefined' || typeof score === 'undefined' || typeof percentile === 'undefined') {
      return res.status(400).json({ ok: false, message: 'Missing required fields: year, score, percentile' });
    }

    const docPayload = {
      uid: decoded.uid,
      email: decoded.email || null,
      year,
      score,
      percentile: Number(percentile),
      predictedRank: typeof predictedRank !== 'undefined' ? predictedRank : null,
      totalCount: typeof totalCount !== 'undefined' ? Number(totalCount) : null,
      rankRange: rankRange || null,
      method: method || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('predictions').add(docPayload);
    return res.status(201).json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error('savePrediction error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'internal error' });
  }
});

module.exports = router;
