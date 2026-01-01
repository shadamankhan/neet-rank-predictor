// backend/tools/set-admin.js
// Usage:
//   node tools/set-admin.js <UID>          (or)
//   ADMIN_UID=<UID> node tools/set-admin.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function initFirebase() {
  // If you already initialize firebase-admin in your server, you can require('../server') instead,
  // but this file does standalone init so it can be run independently.
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Service account file not found at', keyPath);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
}

async function main() {
  await initFirebase();
  const uid = process.argv[2] || process.env.ADMIN_UID;
  if (!uid) {
    console.error('Usage: node tools/set-admin.js <UID>  OR  ADMIN_UID=<UID> node tools/set-admin.js');
    process.exit(1);
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Set custom claim { admin: true } for UID: ${uid}`);
    console.log('Note: ask the user to sign out/in or call getIdToken(true) to refresh token.');
  } catch (err) {
    console.error('❌ Failed to set custom claim:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
