import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth, JWT_SECRET } from "../middleware/requireAuth.js";
import { sendCode } from "../utils/mailer.js";

const router = express.Router();

const CODE_LIFETIME = 10 * 60 * 1000; // 10 minutes
const RESEND_WAIT = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

const publicUser = (u) => ({
  username: u.username,
  email: u.email,
  scores: { rps: u.rpsScore, snake: u.snakeScore },
});

function giveToken(res, user) {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Makes a new 6-digit code, saves it (scrambled) and emails it
async function issueCode(user) {
  const code = String(crypto.randomInt(100000, 1000000));
  user.verifyCode = await bcrypt.hash(code, 10);
  user.verifyExpires = new Date(Date.now() + CODE_LIFETIME);
  user.verifyAttempts = 0;
  await user.save();
  await sendCode(user.email, code);
}

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const email = (req.body.email || "").toLowerCase().trim();
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const byEmail = await User.findOne({ email });
    if (byEmail && byEmail.verified) {
      return res
        .status(409)
        .json({ error: "Username or email already in use" });
    }
    const byName = await User.findOne({
      username,
      ...(byEmail && { _id: { $ne: byEmail._id } }),
    });
    if (byName) {
      return res
        .status(409)
        .json({ error: "Username or email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    let user;
    if (byEmail) {
      // signed up before but never verified: let them start over
      byEmail.username = username;
      byEmail.password = hashed;
      user = byEmail;
    } else {
      user = new User({ username, email, password: hashed });
    }

    try {
      await issueCode(user);
    } catch (err) {
      console.log(err.message);
      return res
        .status(500)
        .json({ error: "Could not send the email. Try again." });
    }

    res.status(201).json({ needsVerification: true, email });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const code = String(req.body.code || "").trim();
    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(400)
        .json({ error: "Nothing to verify for this email" });
    if (user.verified)
      return res
        .status(400)
        .json({ error: "Already verified. Please log in." });
    if (!user.verifyCode || user.verifyExpires < new Date()) {
      return res
        .status(400)
        .json({ error: "Code expired. Request a new one." });
    }
    if (user.verifyAttempts >= MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ error: "Too many wrong tries. Request a new code." });
    }

    const ok = await bcrypt.compare(code, user.verifyCode);
    if (!ok) {
      user.verifyAttempts += 1;
      await user.save();
      return res.status(400).json({ error: "Wrong code" });
    }

    user.verified = true;
    user.verifyCode = undefined;
    user.verifyExpires = undefined;
    user.verifyAttempts = 0;
    await user.save();

    function giveToken(res, user) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/resend", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user || user.verified) {
      return res
        .status(400)
        .json({ error: "Nothing to verify for this email" });
    }

    const sentAt = user.verifyExpires
      ? user.verifyExpires.getTime() - CODE_LIFETIME
      : 0;
    if (Date.now() - sentAt < RESEND_WAIT) {
      return res
        .status(429)
        .json({ error: "Please wait a minute before asking again" });
    }

    await issueCode(user);
    res.json({ ok: true });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Could not send the email. Try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: (email || "").toLowerCase().trim(),
    });
    const ok = user && (await bcrypt.compare(password || "", user.password));
    if (!ok) return res.status(401).json({ error: "Wrong email or password" });

    if (!user.verified) {
      return res.status(403).json({
        error: "Please verify your email first",
        needsVerification: true,
        email: user.email,
      });
    }

    giveToken(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
