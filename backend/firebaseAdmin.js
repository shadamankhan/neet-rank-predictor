// backend/firebaseAdmin.js
// Robust Firebase Admin initializer.
// Tries (in order):
//  1) Application Default Credentials (ADC)
//  2) SERVICE_ACCOUNT_PATH env var (or GOOGLE_APPLICATION_CREDENTIALS) pointing to a JSON file
// If none available, it logs a clear message and exports an object
// whose `isInitialized === false` so callers can detect lack of creds.

const fs = require('fs');
const path = require('path');
const adminLib = require('firebase-admin');

let initialized = false;
let initError = null;
let admin = null;

function tryInitialize() {
  if (adminLib.apps && adminLib.apps.length > 0) {
    admin = adminLib;
    initialized = true;
    return;
  }

  // 1) Try Application Default Credentials (ADC)
  try {
    adminLib.initializeApp({
      credential: adminLib.credential.applicationDefault(),
    });
    admin = adminLib;
    initialized = true;
    console.log('✅ Firebase Admin initialized using Application Default Credentials (ADC).');
    return;
  } catch (err) {
    initError = err;
    console.warn('⚠️ Firebase Admin ADC init failed:', err && err.message ? err.message : err);
  }

  // 2) Try SERVICE_ACCOUNT_PATH env var or GOOGLE_APPLICATION_CREDENTIALS
  const svcPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (svcPath) {
    try {
      const resolved = path.resolve(svcPath);
      if (!fs.existsSync(resolved)) {
        throw new Error(`service account file not found at ${resolved}`);
      }
      const serviceAccount = require(resolved);
      adminLib.initializeApp({
        credential: adminLib.credential.cert(serviceAccount),
      });
      admin = adminLib;
      initialized = true;
      console.log(`✅ Firebase Admin initialized using service account file: ${resolved}`);
      return;
    } catch (err) {
      initError = err;
      console.warn('⚠️ Firebase Admin init with service account failed:', err && err.message ? err.message : err);
    }
  } else {
    console.warn('ℹ️ No SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS env var set; skipping service-account file attempt.');
  }

  // If we reach here, initialization failed.
  console.error('❌ Failed to initialize Firebase Admin. Routes that depend on Firebase will return errors until credentials are configured.');
  if (initError) console.error('Initialization error:', initError && (initError.stack || initError.message) ? (initError.stack || initError.message) : initError);
}

tryInitialize();

module.exports = {
  admin, // may be null if not initialized
  isInitialized: !!admin,
  initError,
};
