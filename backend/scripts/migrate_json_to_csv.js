const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function normalizeBucketsFromArray(arrLike) {
    if (!Array.isArray(arrLike)) return [];

    // Simplistic normalization for migration
    return arrLike.map(item => {
        if (!item && item !== 0) return null;
        if (typeof item === 'object') {
            const s = item.score ?? item.s ?? item.marks;
            const c = item.count ?? item.c ?? item.students;
            if (s !== undefined) return { score: Number(s), count: Number(c || 0) };
            const keys = Object.keys(item);
            if (keys.length === 1 && !isNaN(Number(keys[0]))) {
                return { score: Number(keys[0]), count: Number(item[keys[0]]) || 0 };
            }
        }
        return null;
    }).filter(Boolean);
}

function stringifyCSV(buckets) {
    // Header
    let output = 'score,count\n';
    buckets.forEach(b => {
        output += `${b.score},${b.count}\n`;
    });
    return output;
}

async function migrate() {
    console.log('Starting migration from JSON to CSV...');
    if (!fs.existsSync(DATA_DIR)) {
        console.error('Data directory not found!');
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('distribution_') && f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const year = file.match(/distribution_(\d{4})\.json/)[1];

        try {
            console.log(`Processing ${file}...`);
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);

            let buckets = [];
            // Reuse logic from predictCache (simplified)
            if (Array.isArray(parsed)) {
                buckets = normalizeBucketsFromArray(parsed);
            } else if (parsed && typeof parsed === 'object') {
                buckets = parsed.buckets
                    ? normalizeBucketsFromArray(parsed.buckets)
                    : normalizeBucketsFromArray(parsed.data ?? parsed.distribution ?? parsed.scores ?? []);
            }

            if (buckets.length > 0) {
                const csvContent = stringifyCSV(buckets);
                const csvFilename = `distribution_${year}.csv`;
                fs.writeFileSync(path.join(DATA_DIR, csvFilename), csvContent);
                console.log(`--> Created ${csvFilename}`);
            } else {
                console.warn(`--> Valid buckets not found in ${file}, skipping.`);
            }

        } catch (e) {
            console.error(`Error processing ${file}:`, e.message);
        }
    }
    console.log('Migration complete.');
}

migrate();
