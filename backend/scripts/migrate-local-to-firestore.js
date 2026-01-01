// backend/scripts/migrate-local-to-firestore.js
const fs = require('fs');
const path = require('path');
const firebaseAdmin = require('../firebaseAdmin');
const admin = firebaseAdmin.admin;

async function main() {
  if (!firebaseAdmin.isInitialized || !admin) {
    console.error('Firebase Admin not initialized. Set SERVICE_ACCOUNT_PATH and try again.');
    process.exit(1);
  }
  const file = path.join(__dirname, '..', 'data', 'local-predictions.json');
  if (!fs.existsSync(file)) {
    console.log('No local-predictions.json found.');
    return;
  }
  const raw = fs.readFileSync(file, 'utf8');
  const arr = JSON.parse(raw || '[]');
  const firestore = admin.firestore();
  for (const item of arr) {
    const payload = { ...item };
    delete payload.id;
    // add migratedAt to note migration time
    payload.migratedAt = admin.firestore.FieldValue.serverTimestamp();
    const doc = await firestore.collection('predictions').add(payload);
    console.log('Migrated ->', doc.id);
  }
  console.log('Migration complete. Consider renaming or removing local-predictions.json to prevent duplicates.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
