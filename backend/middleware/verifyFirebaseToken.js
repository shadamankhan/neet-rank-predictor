// backend/middleware/verifyFirebaseToken.js
const admin = require("../initFirebaseAdmin");

module.exports = async function verifyFirebaseToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const match = auth.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }
    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("[verifyFirebaseToken] uid:", decoded.uid, "claims:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("[verifyFirebaseToken] error:", err);
    // Always respond with JSON
    return res.status(401).json({ error: "Unauthorized", details: err.message });
  }
};
