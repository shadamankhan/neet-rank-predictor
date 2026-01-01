// debug_env.js (CommonJS)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// ----------------------
// CONFIG
// ----------------------
const PORT = process.env.PORT || 5000;

// ----------------------
// CORS WHITELIST
// ----------------------
const whitelist = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://neet-rank-predictor.vercel.app",
  "https://neet-rank-predictor-beryl.vercel.app",
  "https://ank-predictor.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools (no origin) like curl/postman
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin));
    }
  })
);

// ----------------------
// FIREBASE ADMIN INIT (prefer file path via env)
// ----------------------
let serviceAccount = null;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const keyPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(keyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
      console.log("ℹ️ Loaded service account from", keyPath);
    } catch (err) {
      console.error("❌ Failed to parse service account file:", err.message);
      process.exit(1);
    }
  } else {
    console.error("❌ GOOGLE_APPLICATION_CREDENTIALS points to missing file:", keyPath);
    process.exit(1);
  }
} else {
  const fallback = path.resolve("./serviceAccount.json");
  if (fs.existsSync(fallback)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(fallback, "utf8"));
      console.log("ℹ️ Loaded serviceAccount.json from disk");
    } catch (err) {
      console.error("❌ Failed to parse serviceAccount.json:", err.message);
      process.exit(1);
    }
  } else {
    console.error("❌ No Firebase service account found. Create serviceAccount.json or set GOOGLE_APPLICATION_CREDENTIALS");
    process.exit(1);
  }
}

// Ensure private_key has real newlines
if (serviceAccount && typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log("✅ Firebase Admin initialized");

// ----------------------
// VERIFY TOKEN (Auth Middleware)
// ----------------------
async function verifyToken(req, res, next) {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: Missing Bearer Token");
  }

  const idToken = tokenHeader.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Firebase Token verification failed:", err.message || err);
    return res.status(401).send("Unauthorized: Invalid Token");
  }
}

// ----------------------
// PREDICT ENDPOINT
// ----------------------
app.post("/api/predict", async (req, res) => {
  const { score, category } = req.body;

  // TODO: replace with real prediction logic
  const predictedRank = "140001-144000";
  const percentile = (score / 720) * 100 || null;

  res.json({
    score,
    category,
    predictedRank,
    percentile
  });
});

// ----------------------
// SAVE PREDICTION (requires login)
// ----------------------
app.post("/api/savePrediction", verifyToken, async (req, res) => {
  const { score, predictedRank, percentile, extra } = req.body;
  const uid = req.user.uid;
  const email = req.user.email || null;

  const data = {
    uid,
    email,
    score,
    predictedRank,
    percentile,
    extra: extra || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection("predictions").add(data);

    await db.collection("users").doc(uid).set(
      {
        email,
        lastPredictionAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("❌ Failed to save prediction:", err);
    res.status(500).send("Failed to save prediction");
  }
});

// ----------------------
// HISTORY ENDPOINT
// ----------------------
app.get("/api/history", verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const snap = await db
      .collection("predictions")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const history = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    res.status(500).send("Failed to fetch history");
  }
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
