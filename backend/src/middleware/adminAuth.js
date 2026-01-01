// src/middleware/adminAuth.js
// Verifies Firebase ID token from Authorization Bearer header and requires isAdmin claim.
// Usage: app.use('/api/admin', adminAuth, adminRoutes);

const admin = require('firebase-admin');

/**
 * Expected:
 * - Authorization: Bearer <idToken>
 * - Firebase Admin initialized elsewhere using ADC (admin.initializeApp())
 */
module.exports = async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ ok: false, error: 'Missing or invalid Authorization header' });

    const idToken = match[1];

    const decoded = await admin.auth().verifyIdToken(idToken);

    // require custom claim 'isAdmin' === true
    // OR allow specific emails as a fallback
    const ALLOWED_EMAILS = ["shadamankhan@gmail.com", "deepclasses1@gmail.com", "admin@example.com"]; // Sync with frontend if possible
    const isEmailAllowed = decoded.email && ALLOWED_EMAILS.includes(decoded.email);

    if (!decoded || (!decoded.isAdmin && !decoded.admin && !isEmailAllowed)) {
      return res.status(403).json({ ok: false, error: 'Admin privileges required' });
    }

    // attach user info
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      claims: decoded
    };

    next();
  } catch (err) {
    console.error('adminAuth error:', err);
    return res.status(401).json({ ok: false, error: 'Invalid token or authentication failed' });
  }
};
