// backend/middleware/requireAdmin.js
module.exports = function requireAdmin(req, res, next) {
  try {
    const u = req.user || {};
    // adapt claim name if you used something else (e.g., isAdmin)
    if (u.admin || u.isAdmin || u['customClaims']?.admin) {
      return next();
    }
    return res.status(403).json({ error: "Admin privileges required" });
  } catch (err) {
    console.error("[requireAdmin] error:", err);
    return res.status(403).json({ error: "Admin privileges required", details: err.message });
  }
};
