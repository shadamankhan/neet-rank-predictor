// backend/scripts/setAdminClaim.js
const admin = require("firebase-admin");

if (!process.argv[2]) {
  console.error("Usage: node scripts/setAdminClaim.js <uid>");
  process.exit(1);
}
const uid = process.argv[2];

async function main() {
  // Attempt to initialize Admin SDK robustly
  try {
    // If ADC is available, use it. Provide projectId explicitly if env var present.
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null;

    if (projectId) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    } else {
      // Try to initialize using application default without projectId first
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (err) {
    console.error("Failed to initialize Admin SDK. Error:");
    console.error(err && err.message ? err.message : err);
    console.error("\nAction: set the environment variable GOOGLE_CLOUD_PROJECT to your Firebase project id and try again.");
    console.error('Example (PowerShell): $env:GOOGLE_CLOUD_PROJECT="neet-rank-predictor-2b483"');
    process.exit(1);
  }

  // Double-check project id is known
  const appProjectId = admin.instanceId ? admin.instanceId().app.options?.projectId : admin.app().options.projectId;
  if (!appProjectId) {
    console.error("Admin SDK still couldn't determine a project ID. Set GOOGLE_CLOUD_PROJECT and retry.");
    process.exit(1);
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
    console.log(`isAdmin claim set for ${uid}`);
    await admin.auth().revokeRefreshTokens(uid);
    console.log(`Revoked refresh tokens for ${uid} (clients must re-authenticate to see new claim).`);
    process.exit(0);
  } catch (err) {
    console.error("Error setting custom claim:", err);
    process.exit(1);
  }
}

main();
