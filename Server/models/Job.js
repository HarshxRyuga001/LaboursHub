import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  labourId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  title:      { type: String, default: "Hiring Request" },
  description:{ type: String, default: "" },
  location:   { type: String },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now }
});

export const Job = mongoose.model("Job", jobSchema);