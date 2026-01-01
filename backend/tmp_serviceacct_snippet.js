/* -- SERVICE ACCOUNT fallback: will read serviceAccount.json if env var missing -- */
const fs = require("fs");
let _serviceAccountFromFile = null;
try {
  const path = "./serviceAccount.json";
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && fs.existsSync(path)) {
    _serviceAccountFromFile = JSON.parse(fs.readFileSync(path, "utf8"));
    // convert escaped newlines if needed
    if (_serviceAccountFromFile.private_key && typeof _serviceAccountFromFile.private_key === "string") {
      _serviceAccountFromFile.private_key = _serviceAccountFromFile.private_key.replace(/\\n/g, "\n");
    }
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(_serviceAccountFromFile);
    console.log("ℹ️ Loaded service account from serviceAccount.json");
  }
} catch(e) {
  console.warn("⚠️ serviceAccount.json load failed:", e.message);
}
