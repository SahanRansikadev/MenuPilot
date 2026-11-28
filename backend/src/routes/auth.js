const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const Session = require("../models/Session");
const User = require("../models/User");
const parseAuthPayload = require("../utils/auth-validation");
const hashSessionToken = require("../utils/hash-session-token");

const router = express.Router();
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
const authAttemptsLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
}

function isDuplicateKeyError(error) {
  return error && typeof error === "object" && error.code === 11000;
}

function clearSessionCookie(res) {
  res.clearCookie("menupilot_session", sessionCookieOptions());
}

async function createSession(res, user, status) {
  const token = randomBytes(32).toString("hex");

  await Session.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000),
  });

  res.cookie("menupilot_session", token, {
    ...sessionCookieOptions(),
    maxAge: sessionLifetimeSeconds * 1000,
  });

  return res.status(status).json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  });
}

router.get("/me", async (req, res) => {
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
      clearSessionCookie(res);
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }

    const user = await User.findById(session.userId).select("name email").lean();
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      clearSessionCookie(res);
      return res.status(401).json({ error: "Account not found. Please sign in again." });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return res.status(503).json({ error: "Unable to load your account right now." });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.menupilot_session;

  try {
    if (token) {
      await Session.deleteOne({ tokenHash: hashSessionToken(token) });
    }
    clearSessionCookie(res);
    return res.json({ message: "Signed out." });
  } catch (error) {
    clearSessionCookie(res);
    console.error("Sign-out failed:", error);
    return res.status(503).json({ error: "Unable to complete sign-out right now." });
  }
});

router.post("/signup", authAttemptsLimit, async (req, res) => {
  const payload = parseAuthPayload(req.body, true);
  if (!payload || !payload.name) {
    return res.status(400).json({
      error: "Enter a valid name, email, and password with at least 8 characters.",
    });
  }

  try {
    const createdUser = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash: await bcrypt.hash(payload.password, 12),
    });

    const savedUser = await User.findById(createdUser._id).select("name email").lean();
    if (!savedUser || savedUser.email !== payload.email) {
      throw new Error("Unable to verify newly created account.");
    }

    return await createSession(res, savedUser, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    console.error("Sign-up failed:", error);
    return res.status(500).json({ error: "Unable to create your account right now." });
  }
});

router.post("/signin", authAttemptsLimit, async (req, res) => {
  const payload = parseAuthPayload(req.body, false);
  if (!payload) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }

  try {
    const user = await User.findOne({ email: payload.email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return await createSession(res, user, 200);
  } catch (error) {
    console.error("Sign-in failed:", error);
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
});

module.exports = router;
