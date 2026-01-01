// scripts/exportPredictionsToCsv.js
// Node script to export predictions collection to a local CSV file.
// Run: node scripts/exportPredictionsToCsv.js /path/to/output.csv

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const BATCH_SIZE = 500;
const COLLECTION = 'predictions';

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

const outPath = process.argv[2] || path.join(__dirname, 'predictions_export.csv');

function escapeCsvField(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// reuse predictionToCsvRow from earlier or duplicate here:
function predictionToCsvRow(docId, data) {
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
  let createdAt = '';
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (data.createdAt) {
    createdAt = String(data.createdAt);
  }
  const raw = { ...data };
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

async function run() {
  const db = admin.firestore();
  const out = fs.createWriteStream(outPath, { encoding: 'utf8' });
  out.write('\uFEFF'); // bom
  const headers = ['docId','uid','userEmail','score','percentile','predictedRank','rankRangeStart','rankRangeEnd','totalCandidates','method','createdAt','rawData'];
  out.write(headers.map(escapeCsvField).join(',') + '\n');

  let lastDoc = null;
  let total = 0;
  while (true) {
    let q = db.collection(COLLECTION).orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const row = predictionToCsvRow(doc.id, doc.data());
      out.write(row.map(escapeCsvField).join(',') + '\n');
      total++;
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < BATCH_SIZE) break;
  }
  out.end();
  console.log(`Wrote ${total} rows to ${outPath}`);
}

run().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
