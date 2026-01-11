const fs = require('fs');
const path = './backend/data/test_series_db.json';

try {
    const data = fs.readFileSync(path, 'utf8');
    const db = JSON.parse(data);
    console.log('Total tests:', db.tests.length);

    // Print table-like structure
    console.log('Index | ID | Status | Type | Title');
    console.log('--- | --- | --- | --- | ---');
    db.tests.forEach((t, index) => {
        console.log(`${index} | ${t.id} | ${t.status} | ${t.type} | "${t.title}"`);
    });

} catch (e) {
    console.error(e);
}
