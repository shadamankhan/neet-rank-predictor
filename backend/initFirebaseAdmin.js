// backend/initFirebaseAdmin.js
// Initializes firebase-admin once and exports the admin instance.
// Place your service account JSON at backend/serviceAccountKey.json (see instructions below).

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Try to locate service account JSON (recommended location: backend/serviceAccountKey.json)
const keyPath = path.resolve(__dirname, "serviceAccountKey.json");

if (!admin.apps.length) {
  if (!fs.existsSync(keyPath)) {
    console.warn("Firebase service account JSON not found at:", keyPath);
    console.warn("Create serviceAccountKey.json from Firebase Console and place it in backend/");
    // Initialize with default credentials (useful in Google Cloud environment),
    // but local dev requires the service account file.
    try {
      admin.initializeApp();
      console.log("Initialized firebase-admin with default credentials.");
    } catch (e) {
      console.error("Failed to initialize firebase-admin. Add serviceAccountKey.json to backend/ or set GOOGLE_APPLICATION_CREDENTIALS.");
      throw e;
    }
  } else {
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized using serviceAccountKey.json");
  }
}

module.exports = admin;
