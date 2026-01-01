// backend/test-firestore.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

try {
  // load your existing service account file path used by server.js
  const keyPath = path.resolve("./serviceAccountKey.json");
  console.log("Reading:", keyPath);
  const raw = fs.readFileSync(keyPath, "utf8");
  const svc = JSON.parse(raw);
  console.log("serviceAccount keys:", Object.keys(svc).slice(0,10));
  if (!svc.client_email || !svc.private_key) {
    console.error("Missing client_email or private_key in service account file");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(svc),
  });

  console.log("Admin SDK initialized. projectId:", admin.app().options.projectId);

  const db = admin.firestore();
  (async () => {
    const docRef = db.collection("__diag_test").doc("ping");
    console.log("Attempting write...");
    await docRef.set({ ts: admin.firestore.FieldValue.serverTimestamp(), note: "diag test" });
    console.log("Write OK — now reading back...");
    const snap = await docRef.get();
    console.log("Read OK:", snap.exists, snap.data());
    console.log("DIAG OK");
    process.exit(0);
  })().catch(err => {
    console.error("DIAG ERROR:", err && err.stack ? err.stack : err);
    process.exit(2);
  });

} catch (e) {
  console.error("Failed to run diag:", e && e.stack ? e.stack : e);
  process.exit(3);
}
