const fs = require('fs');
const path = './backend/data/test_series_db.json';

try {
    const data = fs.readFileSync(path, 'utf8');
    const db = JSON.parse(data);

    console.log('Series count:', db.series ? db.series.length : 'undefined');
    if (db.series && db.series.length > 0) {
        console.log('Series data:', JSON.stringify(db.series, null, 2));
    }

    const typeMap = {
        'mock': 'full',
        'chapter': 'chapter',
        'part': 'part',
        'pyq': 'pyq',
        'free': 'free'
    };

    const chapterTests = db.tests.filter(t => (typeMap[t.type] || 'free') === 'chapter');

    console.log('Tests mapping to "chapter":', chapterTests.length);
    chapterTests.forEach(t => {
        console.log(`ID: ${t.id}, Title: "${t.title}", Status: ${t.status}`);
    });

} catch (e) {
    console.error(e);
}
