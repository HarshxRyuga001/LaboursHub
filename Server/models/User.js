import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:         { type: String, required: true, unique: true, trim: true },
  city:          { type: String, required: true, trim: true },
  passwordHash:  { type: String, required: true },
  identity:      { type: String, required: true },
  role:          { type: String, enum: ['labour','customer'], required: true },
  validProof: {
    filename:    String,
    path:        String,
    mimetype:    String,
    size:        Number,
    uploadedAt:  { type: Date, default: Date.now }
  },
  createdAt:     { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);