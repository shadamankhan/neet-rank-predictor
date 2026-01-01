// check_env.js
require('dotenv').config();
try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not set in process.env");
    process.exit(1);
  }
  const obj = JSON.parse(raw);
  const pk = obj.private_key || "";
  console.log("private_key starts with:", pk.slice(0,40).replace(/\n/g, "\\n"));
  console.log("Contains literal backslash+n sequence? ->", pk.includes("\\n"));
  console.log("Contains actual newline characters? ->", pk.includes("\n"));
  // Quick PEM header/footer check
  console.log("Has BEGIN marker? ->", pk.includes("-----BEGIN PRIVATE KEY-----"));
  console.log("Has END marker?   ->", pk.includes("-----END PRIVATE KEY-----"));
} catch (e) {
  console.error("❌ Parse error:", e.message);
  process.exit(1);
}
