import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  phone: Number,
  city: String,
  password: String,
  identity: Number,
  valid_proof: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Users = mongoose.model("Users", userSchema);