// backend/scripts/grantAdmin.js
const admin = require("../initFirebaseAdmin");
const uid = process.argv[2];
if (!uid) {
  console.error("Usage: node grantAdmin.js <uid>");
  process.exit(1);
}

async function run() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("Granted admin to", uid);
    // optional: store in a Firestore 'admins' collection for your UI
    await admin.firestore().collection("app_meta").doc("admins").set({
      [uid]: true
    }, { merge: true });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
}

run();
