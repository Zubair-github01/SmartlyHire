// server/models/InterviewAttempt.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Each answer the candidate gives
const answerSchema = new Schema({
  questionText: String,
  // Allow different kinds, but treat technical/behavioral as text in the UI
  type: {
    type: String,
    enum: ["text", "coding", "mcq", "technical", "behavioral"],
    default: "text",
  },
  answerText: String,   // for normal text / technical / behavioral answers
  codeAnswer: String,   // for coding answers
});

// Per-question AI evaluation
const perQuestionEvalSchema = new Schema({
  questionIndex: Number,  // index in answers[]
  score: { type: Number, min: 0, max: 10 },
  strengths: String,
  weaknesses: String,
  feedback: String,
});

// Overall AI summary / final result
const finalReportSchema = new Schema({
  totalScore: Number,
  maxScore: Number,
  averageScore: Number,
  integrityScore: Number, // 0–1
  verdict: String,        // "pass" | "fail" | "flagged" etc.
  summary: String,
});
// Proctoring (no video, only events + counts)
const proctoringSchema = new Schema(
  {
    integrityScore: { type: Number, default: 100 }, // 0..100 (live proctor score)
    focusLostCount: { type: Number, default: 0 },
    noFaceCount: { type: Number, default: 0 },
    multipleFacesCount: { type: Number, default: 0 },
    suspiciousObjectCount: { type: Number, default: 0 },
    events: { type: [String], default: [] },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { _id: false }
);

// Main InterviewAttempt document
const interviewAttemptSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    // Answers in order
    answers: [answerSchema],

    // submitted = waiting for evaluation, evaluated = AI done
    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated"],
      default: "in_progress", 
    },
    //proctoring summary (events/counters, no video)
    proctoring: { type: proctoringSchema, default: () => ({}) 
    },

    evaluation: {
      model: String,
      perQuestion: [perQuestionEvalSchema],
      totalScore: Number,
      evaluatedAt: Date,
    },

    finalReport: finalReportSchema,
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("InterviewAttempt", interviewAttemptSchema);
