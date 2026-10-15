import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: "Not logged in" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Not logged in" });
  }
}
