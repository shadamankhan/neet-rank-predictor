// setAdminClaim.js
// Usage:
//   node setAdminClaim.js <uid-or-email> true    -> set admin claim
//   node setAdminClaim.js <uid-or-email> false   -> remove admin claim

const admin = require('./initFirebaseAdmin'); // keep your existing init file

async function main() {
  const arg = process.argv[2];
  const makeAdmin = process.argv[3] === 'true';

  if (!arg) {
    console.error('usage: node setAdminClaim.js <uid-or-email> <true|false>');
    process.exit(1);
  }

  try {
    // try to treat arg as uid first (fast)
    let userRecord = null;
    try {
      userRecord = await admin.auth().getUser(arg);
      console.log('Found user by UID:', userRecord.uid);
    } catch (errUid) {
      // if not found by UID, try by email
      try {
        userRecord = await admin.auth().getUserByEmail(arg);
        console.log('Found user by email:', userRecord.email, 'uid:', userRecord.uid);
      } catch (errEmail) {
        console.error('User not found by UID or email:', arg);
        process.exit(2);
      }
    }

    const uid = userRecord.uid;
    if (makeAdmin) {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      console.log(`Set admin=true for uid=${uid}`);
    } else {
      await admin.auth().setCustomUserClaims(uid, { admin: false });
      console.log(`Set admin=false for uid=${uid}`);
    }

    // optionally print the updated claims
    const updated = await admin.auth().getUser(uid);
    console.log('Updated custom claims:', updated.customClaims || {});

    process.exit(0);
  } catch (err) {
    console.error('Error setting custom claim:', err);
    process.exit(3);
  }
}

main();
