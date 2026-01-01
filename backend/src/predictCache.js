// backend/src/predictCache.js
// Robust distribution loader + in-memory cache
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const chokidar = require('chokidar');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE = new Map();

/* ---------- Helpers ---------- */

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) { /* ignore */ }
}

function normalizeBucketsFromArray(arrLike) {
  if (!Array.isArray(arrLike)) return [];
  // Map possible shapes into {score, count}
  const mapped = arrLike.map(item => {
    if (!item && item !== 0) return null;
    // If item is a plain number or string array, skip
    if (typeof item === 'number') return null;

    // If item is array-like [score, count]
    if (Array.isArray(item) && item.length >= 2) {
      return { score: Number(item[0]), count: Number(item[1]) || 0 };
    }

    // If item is object try common keys
    if (typeof item === 'object') {
      const s = item.score ?? item.s ?? item.marks ?? item.MARK ?? item.SCORE;
      const c = item.count ?? item.c ?? item.students ?? item.students_count ?? item.freq ?? item.frequency;
      if (s !== undefined) return { score: Number(s), count: Number(c || 0) };
      // case: { "720": 12 }
      const keys = Object.keys(item);
      if (keys.length === 1 && !isNaN(Number(keys[0]))) {
        return { score: Number(keys[0]), count: Number(item[keys[0]]) || 0 };
      }
    }
    return null;
  }).filter(Boolean);

  // Combine same scores and sort desc
  const map = new Map();
  for (const it of mapped) {
    if (!Number.isFinite(it.score)) continue;
    const s = Number(it.score);
    const c = Number(it.count) || 0;
    map.set(s, (map.get(s) || 0) + c);
  }
  const buckets = Array.from(map.entries()).map(([score, count]) => ({ score: Number(score), count: Number(count) }));
  buckets.sort((a, b) => b.score - a.score);
  return buckets;
}

/* Attempts to parse file content (JSON or CSV) into canonical { year, buckets } */
async function loadDistributionFromFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  // CSV Preferred
  if (ext === '.csv') {
    try {
      const records = parse(raw, { columns: true, skip_empty_lines: true });
      // columns: true returns array of objects keyed by header names.
      return { year: null, buckets: normalizeBucketsFromArray(records) };
    } catch (err) {
      // couldn't parse as CSV
      return { year: null, buckets: [] };
    }
  }

  // JSON Legacy support
  if (ext === '.json' || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = null;
    }
    if (parsed !== null) {
      if (Array.isArray(parsed)) {
        return { year: null, buckets: normalizeBucketsFromArray(parsed) };
      }
      if (parsed && typeof parsed === 'object') {
        const buckets = parsed.buckets || parsed.data || parsed.distribution || parsed.scores || [];
        return { year: parsed.year ?? null, buckets: normalizeBucketsFromArray(buckets) };
      }
    }
  }
  return { year: null, buckets: [] };
}

/* Save canonical CSV file distribution_<year>.csv atomically */
async function saveDistributionCsv(year, distributionObj) {
  await ensureDataDir();
  const filename = `distribution_${year}.csv`;
  const tmp = `.${filename}.tmp`;
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = path.join(DATA_DIR, tmp);

  // Convert distributionObj to CSV string: score,count
  const csvContent = stringify(distributionObj.buckets, {
    header: true,
    columns: ['score', 'count']
  });

  await fs.writeFile(tmpPath, csvContent, 'utf8');
  // atomic rename
  await fs.rename(tmpPath, filePath);
  // reload into cache
  return await loadYearToCache(year);
}

/* Load a distribution file for a specific year into CACHE with cumulative counts */
async function loadYearToCache(year) {
  // Try CSV first, then JSON
  const csvFilename = `distribution_${year}.csv`;
  const jsonFilename = `distribution_${year}.json`;

  let filePath = path.join(DATA_DIR, csvFilename);
  let isCsv = true;

  try {
    await fs.access(filePath);
  } catch (e) {
    // CSV not found, try JSON
    filePath = path.join(DATA_DIR, jsonFilename);
    isCsv = false;
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    let buckets = [];

    if (isCsv) {
      const records = parse(raw, { columns: true, skip_empty_lines: true });
      buckets = normalizeBucketsFromArray(records);
    } else {
      const parsed = JSON.parse(raw);
      buckets = Array.isArray(parsed.buckets) && parsed.buckets.length
        ? normalizeBucketsFromArray(parsed.buckets)
        : normalizeBucketsFromArray(parsed.data ?? parsed.distribution ?? parsed.scores ?? parsed.buckets ?? parsed);
    }

    // ensure sorted desc
    buckets.sort((a, b) => b.score - a.score);

    // compute totals and cumulative
    let total = 0;
    for (const b of buckets) total += Number(b.count || 0);
    let cumulative = 0;
    const cumulativeBuckets = buckets.map(b => {
      cumulative += Number(b.count || 0);
      return { score: Number(b.score), count: Number(b.count || 0), cumulative }; // cumulative = number scored >= this score
    });

    CACHE.set(String(year), { year: Number(year), total, buckets: cumulativeBuckets });
    console.log(`Loaded distribution for year ${year} (CSV: ${isCsv}, items: ${buckets.length}, total: ${total})`);
    return CACHE.get(String(year));
  } catch (err) {
    // file missing or parse error
    console.warn(`No distribution file or parse error for year ${year}: ${err.message}`);
    CACHE.delete(String(year));
    return null;
  }
}

/* Load all existing distribution_*.csv (and .json legacy) files into cache at startup */
async function loadAllDistributionsOnStartup() {
  await ensureDataDir();
  const files = fsSync.readdirSync(DATA_DIR).filter(f => f.startsWith('distribution_') && (f.endsWith('.csv') || f.endsWith('.json')));

  // Prioritize CSV if both exist (handled by loadYearToCache logic which prefers CSV)
  const years = new Set();
  files.forEach(f => {
    const m = f.match(/distribution_(\d{4})\.(csv|json)/);
    if (m) years.add(m[1]);
  });

  const loadPromises = Array.from(years).map(async year => {
    await loadYearToCache(year);
  });
  await Promise.all(loadPromises);
}

/* Watch data dir and reload on changes (optional) */
function startWatcher() {
  try {
    const watcher = chokidar.watch(DATA_DIR, { ignoreInitial: true });
    watcher.on('add', fp => {
      const m = fp.match(/distribution_(\d{4})\.(csv|json)$/);
      if (m) loadYearToCache(m[1]);
    });
    watcher.on('change', fp => {
      const m = fp.match(/distribution_(\d{4})\.(csv|json)$/);
      if (m) loadYearToCache(m[1]);
    });
    watcher.on('unlink', fp => {
      const m = fp.match(/distribution_(\d{4})\.(csv|json)$/);
      if (m) CACHE.delete(m[1]);
    });
  } catch (e) {
    console.warn('Watcher not started:', e.message);
  }
}

/* Public getters */
function getDistribution(year) {
  return CACHE.get(String(year)) || null;
}
function listCachedYears() {
  return Array.from(CACHE.keys()).sort();
}

/* Import a parsed distribution object (parsedObj: { year?, buckets: [...] }) */
async function importDistribution(parsedObj, yearIfMissing) {
  const year = parsedObj.year || yearIfMissing;
  if (!year) throw new Error('Year is required');
  const buckets = parsedObj.buckets && parsedObj.buckets.length ? parsedObj.buckets : parsedObj.data ?? parsedObj.distribution ?? parsedObj.scores ?? [];
  const normalized = normalizeBucketsFromArray(buckets);
  // Always save as CSV now
  await saveDistributionCsv(year, { year, buckets: normalized });
  return await loadYearToCache(year);
}

/* Delete a distribution file and remove from cache */
async function deleteYear(year) {
  // Try delete both
  const csvPath = path.join(DATA_DIR, `distribution_${year}.csv`);
  const jsonPath = path.join(DATA_DIR, `distribution_${year}.json`);

  try {
    if (fsSync.existsSync(csvPath)) await fs.unlink(csvPath);
    if (fsSync.existsSync(jsonPath)) await fs.unlink(jsonPath);

    CACHE.delete(String(year));
    console.log(`Deleted distribution for year ${year}`);
    return true;
  } catch (err) {
    console.warn(`Failed to delete year ${year}: ${err.message}`);
    throw err;
  }
}

module.exports = {
  DATA_DIR,
  ensureDataDir,
  loadDistributionFromFile,
  saveDistributionJson: saveDistributionCsv, // Alias old name to new CSV saver
  saveDistributionCsv,
  loadYearToCache,
  loadAllDistributionsOnStartup,
  startWatcher,
  getDistribution,
  listCachedYears,
  importDistribution,
  deleteYear,
  _CACHE_INTERNAL: CACHE
};
