const Session = require("../models/Session");
const User = require("../models/User");
const hashSessionToken = require("../utils/hash-session-token");

async function requireAuth(req, res, next) {
  const token = req.cookies?.menupilot_session;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }

    const user = await User.findById(session.userId).select("_id").lean();
    if (!user) {
      return res.status(401).json({ error: "Account not found. Please sign in again." });
    }

    req.userId = session.userId;
    return next();
  } catch (error) {
    console.error("API session lookup failed:", error);
    return res.status(503).json({ error: "Unable to verify your session right now." });
  }
}

module.exports = requireAuth;
