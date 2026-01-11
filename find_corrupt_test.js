const fs = require('fs');
const path = './backend/data/test_series_db.json';
try {
  const data = fs.readFileSync(path, 'utf8');
  const db = JSON.parse(data);
  console.log('Total tests:', db.tests.length);
  db.tests.forEach((t, index) => {
    // Check for tests that might render as blank
    // i.e. status is Live (or missing/undefined which might default to something else in some logic, but backend filters for 'Live')
    // AND has missing title or empty title
    if (t.status === 'Live' && (!t.title || t.title.trim() === '')) {
      console.log('Found suspiciously empty test at index:', index);
      console.log(JSON.stringify(t, null, 2));
    }
     // Also check for tests with very few fields
    if (t.status === 'Live' && Object.keys(t).length < 5) {
       console.log('Found minimal test at index:', index, JSON.stringify(t, null, 2));
    }
  });
} catch (e) {
  console.error(e);
}
