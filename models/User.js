import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    rpsScore: { type: Number, default: 0 },
    snakeScore: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verifyCode: String,
    verifyExpires: Date,
    verifyAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
