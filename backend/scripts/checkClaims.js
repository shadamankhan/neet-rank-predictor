// backend/scripts/checkClaims.js
const admin = require("../initFirebaseAdmin");
const uid = process.argv[2];
if (!uid) {
  console.error("Usage: node checkClaims.js <UID>");
  process.exit(1);
}

async function run() {
  try {
    const user = await admin.auth().getUser(uid);
    console.log("Custom claims for", uid, "=>", user.customClaims || {});
    process.exit(0);
  } catch (err) {
    console.error("Failed to get user:", err);
    process.exit(2);
  }
}
run();
