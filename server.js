import "dotenv/config";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

const PORT = process.env.PORT || 8888;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
server.set("trust proxy", 1); // Render sits behind a proxy
server.use(express.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, "gameUI")));

server.use(
  cors({
    origin: [
      "http://localhost:8888",
      "YOUR_FRONTEND_RENDER_URL"
    ],
    credentials: true,
  }),
);

server.use(express.json());

server.use("/api/auth", authRoutes);

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/gameHistory",
    );
    console.log("DB connected");
  } catch (err) {
    console.log(err.message);
  }
};
connectDB();

server.listen(PORT, () => {
  console.log("Server running on PORT " + PORT);
});
