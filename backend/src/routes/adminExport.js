// src/routes/adminExport.js
// Express router exposing /api/admin/export which streams CSV of Firestore 'predictions'.
// Streams results in batches to avoid memory blowups.
//
// Columns included (customize below):
// uid, userEmail, score, percentile, predictedRank, rankRangeStart, rankRangeEnd, totalCandidates, method, createdAt, rawData (JSON)
//
// Note: Keeps camelCase keys in CSV headers.

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { Transform } = require('stream');

const BATCH_SIZE = 500; // number of docs fetched per batch (tune as needed)
const COLLECTION = 'predictions';

/**
 * Escape a CSV field according to RFC4180.
 */
function escapeCsvField(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert a prediction Firestore doc (data object) to an array of CSV columns in the order below.
 * Customize columns here.
 */
function predictionToCsvRow(docId, data) {
  // normalize/guard fields that may be absent or in different shape
  const uid = data.uid || data.userUid || '';
  const userEmail = data.email || data.userEmail || '';
  const score = data.score != null ? data.score : '';
  const percentile = data.percentile != null ? data.percentile : '';
  const predictedRank = data.predictedRank != null ? data.predictedRank : '';
  let rankRangeStart = '';
  let rankRangeEnd = '';
  if (Array.isArray(data.rankRange)) {
    rankRangeStart = data.rankRange[0] ?? '';
    rankRangeEnd = data.rankRange[1] ?? '';
  } else if (typeof data.rankRange === 'string') {
    // attempt to split "start - end"
    const m = data.rankRange.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) {
      rankRangeStart = m[1];
      rankRangeEnd = m[2];
    } else {
      rankRangeStart = data.rankRange;
    }
  } else if (data.rankRange && typeof data.rankRange === 'object') {
    rankRangeStart = data.rankRange.start ?? '';
    rankRangeEnd = data.rankRange.end ?? '';
  }

  const totalCandidates = data.totalCandidates != null ? data.totalCandidates : '';
  const method = data.method || '';
  // createdAt could be Firestore Timestamp
  let createdAt = '';
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (data.createdAt) {
    createdAt = String(data.createdAt);
  }

  // provide raw JSON string for any other meta
  const raw = { ...data };
  // Remove fields we already surfaced to keep raw smaller
  delete raw.uid; delete raw.userUid; delete raw.userEmail; delete raw.email;
  delete raw.score; delete raw.percentile; delete raw.predictedRank; delete raw.rankRange;
  delete raw.totalCandidates; delete raw.method; delete raw.createdAt;

  return [
    docId,
    uid,
    userEmail,
    score,
    percentile,
    predictedRank,
    rankRangeStart,
    rankRangeEnd,
    totalCandidates,
    method,
    createdAt,
    JSON.stringify(raw)
  ];
}

router.get('/export', async (req, res) => {
  try {
    const db = admin.firestore();

    // set headers for attachment CSV
    const filename = `predictions_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    // write BOM for Excel compatibility (optional but helpful)
    res.write('\uFEFF');

    // header row (camelCase)
    const headers = [
      'docId',
      'uid',
      'userEmail',
      'score',
      'percentile',
      'predictedRank',
      'rankRangeStart',
      'rankRangeEnd',
      'totalCandidates',
      'method',
      'createdAt',
      'rawData'
    ];
    res.write(headers.map(escapeCsvField).join(',') + '\n');

    // Query in batches ordered by __name__ to enable cursoring safely
    let lastDoc = null;
    let fetched = 0;

    while (true) {
      let q = db.collection(COLLECTION).orderBy('__name__').limit(BATCH_SIZE);
      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        const data = doc.data();
        const row = predictionToCsvRow(doc.id, data);
        const csvLine = row.map(escapeCsvField).join(',') + '\n';
        // if client disconnected, stop processing
        if (!res.writableEnded) {
          const ok = res.write(csvLine);
          fetched++;
          // continue; Node will handle backpressure on res stream
        } else {
          // client closed connection
          console.warn('Client disconnected during CSV export');
          return;
        }
      }

      lastDoc = snap.docs[snap.docs.length - 1];
      // If fewer than batch size, we've reached the end
      if (snap.size < BATCH_SIZE) break;
    }

    // end stream
    res.end();
    console.log(`Exported ${fetched} prediction rows`);
  } catch (err) {
    console.error('Error exporting predictions CSV:', err);
    // if response already started, try to end gracefully
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Failed to export predictions' });
    } else {
      try { res.end(); } catch (e) {}
    }
  }
});

module.exports = router;
