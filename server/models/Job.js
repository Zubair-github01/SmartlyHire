// server/models/Job.js
const mongoose = require("mongoose");

// Schema for a single interview question
const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["technical", "behavioral", "coding", "mcq", "text", "voice"],
      required: true,
    },
    question: { type: String, required: true },
    options: [{ type: String }],
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },

    numberOfQuestions: { type: Number, default: 0 },
    applicationDeadline: { type: Date, required: true },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    questions: [questionSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
