// server.js (replace entire file with this)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const app = express();
app.use(cors());
app.use(express.json());

/* ----------------------- constants & paths ----------------------- */
const TOTAL_CANDIDATES = 1800000; // adjust if you have better number
const CSV_PATH = path.join(__dirname, 'data', 'score_percentile.csv');
const CORR_PATH = path.join(__dirname, 'data', 'corrections.json');
const COLLEGE_PATH = path.join(__dirname, 'data', 'colleges.csv');

/* ----------------------- percentile table loader ----------------------- */
let percentileTable = [];
function loadCSV(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      console.error('CSV not found at', filepath);
      return [];
    }
    const raw = fs.readFileSync(filepath, 'utf8');
    const records = parse(raw, { columns: true, trim: true });
    const table = records.map(r => ({
      score: Number(r.score),
      percentile: Number(r.percentile)
    })).filter(r => !isNaN(r.score) && !isNaN(r.percentile))
      .sort((a,b) => b.score - a.score);
    return table;
  } catch (e) {
    console.error('Failed to load CSV:', e && e.message ? e.message : e);
    return [];
  }
}
percentileTable = loadCSV(CSV_PATH);
console.log('Loaded percentile table rows:', percentileTable.length);

/* ----------------------- percentile <-> rank helpers ----------------------- */
function estimatePercentileFromTable(score){
  if(!percentileTable || percentileTable.length === 0) return null;
  const table = percentileTable;
  // exact match
  for(const row of table) if(score === row.score) return row.percentile;
  // above highest
  if(score > table[0].score) return table[0].percentile;
  // below lowest -> proportional down to 0
  const last = table[table.length - 1];
  if(score < last.score) return Math.max(0, (score / last.score) * last.percentile);
  // find interval
  for(let i=0;i<table.length-1;i++){
    const hi = table[i];
    const lo = table[i+1];
    if(score < hi.score && score > lo.score){
      const t = (score - lo.score) / (hi.score - lo.score);
      const pct = lo.percentile + t * (hi.percentile - lo.percentile);
      return pct;
    } else if(score === lo.score) return lo.percentile;
  }
  return table[table.length-1].percentile;
}

function percentileToRank(percentile){
  const p = Math.min(Math.max(percentile, 0), 99.999);
  const rank = Math.round(TOTAL_CANDIDATES * (100 - p) / 100);
  return Math.max(1, rank);
}

/* ----------------------- corrections loader ----------------------- */
let corrections = { categories: {}, states: {} };
if(fs.existsSync(CORR_PATH)) {
  try { corrections = JSON.parse(fs.readFileSync(CORR_PATH, 'utf8')); console.log('Loaded corrections.json'); }
  catch(e){ console.warn('Invalid corrections.json'); }
}

/* corrections apply function */
function applyCorrections(percentile, category, state){
  let p = percentile;
  if(category && corrections.categories && corrections.categories[category]){
    const c = corrections.categories[category];
    if(c.mode === 'add') p += c.value;
    else if(c.mode === 'mul') p *= c.value;
  }
  if(state && corrections.states && corrections.states[state]){
    const s = corrections.states[state];
    if(s.mode === 'add') p += s.value;
    else if(s.mode === 'mul') p *= s.value;
  }
  return Math.min(99.999, Math.max(0, p));
}

/* ----------------------- colleges loader ----------------------- */
let colleges = [];
function loadColleges() {
  try {
    if (!fs.existsSync(COLLEGE_PATH)) {
      console.warn('No colleges.csv found at', COLLEGE_PATH);
      colleges = [];
      return;
    }
    const raw = fs.readFileSync(COLLEGE_PATH, 'utf8');
    const rows = parse(raw, { columns: true, trim: true });
    colleges = rows.map(r => ({
      college: r.college,
      category: r.category || 'All',
      seats: Number((r.seats || '').toString().replace(/,/g, '')) || 0,
      min_rank: Number((r.min_rank || '').toString().replace(/,/g, '')) || Number.POSITIVE_INFINITY,
      max_rank: Number((r.max_rank || '').toString().replace(/,/g, '')) || Number.POSITIVE_INFINITY,
      fees_per_year: Number((r.fees_per_year || '').toString().replace(/,/g, '')) || null,
      category_seats: r.category_seats || null,
      home_state: r.home_state || null
    }));
    console.log('Loaded colleges:', colleges.length);
    console.log('DEBUG: colleges preview:', colleges.slice(0, 10));
  } catch (e) {
    console.warn('Failed to load colleges.csv:', e.message || e);
    colleges = [];
  }
}
loadColleges();

/* ----------------------- suggest colleges (robust) ----------------------- */
/*
  Returns array of {college, category, seats, min_rank, max_rank, fees_per_year, likelihood, reason}
  Sorted by likelihood and distance.
*/
function tryParseJSON(s){
  try { return JSON.parse(s); } catch(e){ return {}; }
}

function suggestCollegesByRank(rank, { category='General', state='Default', limit=7, maxDistance=200000, minLikelihood=5 } = {}) {
  if (!colleges || colleges.length === 0) return [];

  const norm = colleges.map(c => ({
    ...c,
    min_rank: Number((c.min_rank||'').toString().replace(/,/g,'')) || Number.POSITIVE_INFINITY,
    max_rank: Number((c.max_rank||'').toString().replace(/,/g,'')) || Number.POSITIVE_INFINITY,
    seats: Number((c.seats||'').toString().replace(/,/g,'')) || 0,
    fees_per_year: Number((c.fees_per_year||'').toString().replace(/,/g,'')) || null,
    category_seats: typeof c.category_seats === 'string' ? tryParseJSON(c.category_seats) : (c.category_seats || {})
  }));

  const scored = norm.map(c => {
    const inside = rank >= c.min_rank && rank <= c.max_rank;
    let distance = 0;
    if (!inside) distance = rank < c.min_rank ? c.min_rank - rank : rank - c.max_rank;

    // effective seats for category fallback
    let effectiveSeats = c.seats;
    if (c.category_seats && c.category_seats[category] != null) {
      const v = Number(c.category_seats[category]);
      if (!isNaN(v) && v >= 0) effectiveSeats = v;
    }

    const rangeSize = Math.max(1, c.max_rank - c.min_rank + 1);

    // likelihood calculation
    let base;
    if (inside) {
      const center = (c.min_rank + c.max_rank) / 2;
      const closeness = 1 - (Math.abs(rank - center) / (rangeSize/2 + 1));
      base = 0.75 + 0.25 * Math.max(0, closeness);
    } else {
      const scaled = Math.max(0, 1 - (distance / (rangeSize * 3 + 1)));
      base = scaled * 0.6;
    }

    const seatFactor = 1 + Math.min(0.5, effectiveSeats / 500);
    let likelihood = Math.round(Math.min(100, base * seatFactor * 100));

    if (!inside && distance > 0 && distance <= Math.max(10, Math.round(rangeSize * 0.2)) && likelihood < 5) {
      likelihood = 5;
    }

    const reason = inside ? 'In range' : `Nearest by ${distance.toLocaleString()} ranks`;

    return { ...c, distance, rangeSize, effectiveSeats, likelihood, reason, inside };
  });

  // exact matches first
  const exact = scored.filter(s => s.inside).sort((a,b) => (b.likelihood - a.likelihood) || (a.rangeSize - b.rangeSize));
  if (exact.length > 0) {
    return exact.slice(0, limit).map(c => ({
      college: c.college,
      category: c.category,
      seats: c.seats,
      min_rank: c.min_rank,
      max_rank: c.max_rank,
      fees_per_year: c.fees_per_year,
      likelihood: c.likelihood,
      reason: c.reason
    }));
  }

  const nearest = scored
    .filter(s => s.distance <= maxDistance)
    .filter(s => s.likelihood >= minLikelihood)
    .sort((a,b) => {
      if (b.likelihood !== a.likelihood) return b.likelihood - a.likelihood;
      return a.distance - b.distance;
    })
    .slice(0, limit)
    .map(c => ({
      college: c.college,
      category: c.category,
      seats: c.seats,
      min_rank: c.min_rank,
      max_rank: c.max_rank,
      fees_per_year: c.fees_per_year,
      likelihood: c.likelihood,
      reason: c.reason
    }));

  return nearest;
}

/* ----------------------- reload endpoint ----------------------- */
app.post('/api/reload-data', (req, res) => {
  try {
    percentileTable = loadCSV(CSV_PATH);
    if (fs.existsSync(CORR_PATH)) {
      try { corrections = JSON.parse(fs.readFileSync(CORR_PATH, 'utf8')); console.log('Reloaded corrections.json'); }
      catch(e){ console.warn('Invalid corrections.json on reload'); }
    }
    loadColleges();
    res.json({ ok:true, message:'reloaded' });
  } catch(e) {
    console.error('Reload error', e);
    res.status(500).json({ ok:false, error: (e && e.message) || e });
  }
});

/* ----------------------- single /api/predict route ----------------------- */
app.post('/api/predict', (req, res) => {
  // Accept either score (preferred) or rank (direct)
  const { score, rank: rankInput, category = 'General', state = 'Default' } = req.body;

  // If neither provided, error
  if (score == null && rankInput == null) return res.status(400).json({ error: 'score or rank required' });

  let rank, pctRaw;

  if (rankInput != null) {
    // user provided rank directly
    rank = Number(rankInput);
    if (isNaN(rank) || rank <= 0) return res.status(400).json({ error: 'invalid rank' });

    // estimate raw percentile from rank (inverse of percentileToRank)
    pctRaw = Math.max(0, Math.min(99.999, 100 - (rank / TOTAL_CANDIDATES) * 100));
  } else {
    // user provided score -> compute percentile via CSV interpolation
    const pct = estimatePercentileFromTable(Number(score));
    if (pct == null) return res.status(500).json({ error: 'percentile table not loaded' });
    pctRaw = pct;
  }

  // apply corrections (category/state)
  const pctCorrected = applyCorrections(pctRaw, category, state);

  // compute final rank (recalculate from corrected percentile)
  rank = percentileToRank(pctCorrected);

  // Category threshold: General -> 50%, OBC/SC/ST/EWS -> 45%
  const cat = (category || 'General').toString();
  const lowerCaseCat = cat.toLowerCase();
  let thresholdPercentile = 50;
  if (['obc','sc','st','ews'].includes(lowerCaseCat)) thresholdPercentile = 45;

  // compute max allowed rank for threshold
  const maxAllowedRank = percentileToRank(thresholdPercentile);

  // get raw suggestions then filter by threshold (min_rank <= maxAllowedRank)
  let collegesSuggested = [];
  try {
    const opts = { category, state, limit: 10, maxDistance: 200000, minLikelihood: 5 };
    const rawSuggestions = (typeof suggestCollegesByRank === 'function') ? suggestCollegesByRank(rank, opts) : [];

    collegesSuggested = rawSuggestions.filter(c => {
      if (!c || c.min_rank == null) return false;
      return Number(c.min_rank) <= Number(maxAllowedRank);
    });

    // optional fallback if empty: uncomment to return nearest low-confidence suggestions
    // if (collegesSuggested.length === 0) {
    //   collegesSuggested = rawSuggestions.slice(0,3).map(c => ({ ...c, note: 'Below threshold — low confidence' }));
    // }
  } catch (e) {
    console.warn('Error suggesting colleges in predict:', e && e.message ? e.message : e);
    collegesSuggested = [];
  }

  res.json({
    input: { score: score ?? null, rank: rankInput ?? null, category, state },
    score: score != null ? Number(score) : null,
    estimated_percentile_raw: Number(pctRaw.toFixed(3)),
    estimated_percentile_corrected: Number(pctCorrected.toFixed(3)),
    estimated_rank: Number(rank),
    thresholdPercentile,
    thresholdMaxRank: Number(maxAllowedRank),
    colleges_suggested: collegesSuggested,
    note: 'Prediction uses CSV interpolation + simple category corrections. Replace CSV with historic tables for production accuracy.'
  });
});

/* ----------------------- server start ----------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Backend running on port ${PORT}`));
