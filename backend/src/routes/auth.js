const { createHash, randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const Session = require("../models/Session");
const User = require("../models/User");
const parseAuthPayload = require("../utils/auth-validation");

const router = express.Router();
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

function isDuplicateKeyError(error) {
  return error && typeof error === "object" && error.code === 11000;
}

async function createSession(res, user, status) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await Session.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000),
  });

  res.cookie("menupilot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
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

router.post("/signup", async (req, res) => {
  const payload = parseAuthPayload(req.body, true);
  if (!payload || !payload.name) {
    return res.status(400).json({
      error: "Enter a valid name, email, and password with at least 8 characters.",
    });
  }

  try {
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash: await bcrypt.hash(payload.password, 12),
    });
    return await createSession(res, user, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    console.error("Sign-up failed:", error);
    return res.status(503).json({ error: "Unable to create your account right now." });
  }
});

router.post("/signin", async (req, res) => {
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
    return res.status(503).json({ error: "Unable to sign in right now." });
  }
});

module.exports = router;
