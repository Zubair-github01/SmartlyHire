// server/routes/interviewAnswerRoutes.js
const express = require("express");
const router = express.Router();

const InterviewAttempt = require("../models/InterviewAttempt");
const Job = require("../models/Job");
const { protect } = require("../middleware/auth");

// POST /api/interview/submit
router.post("/submit", protect, async (req, res) => {
  try {
    const { jobId, answers } = req.body;

    if (!jobId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "jobId and answers are required" });
    }

    // Make sure job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // user info from token (protect middleware)
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "User not found in request" });
    }

    const attempt = await InterviewAttempt.create({
      job: job._id,
      candidate: user._id,
      candidateName: user.name,
      candidateEmail: user.email,
      answers,
    });

    return res.status(201).json({
      message: "Interview submitted successfully",
      attemptId: attempt._id,
    });
  } catch (err) {
    console.error("Error submitting interview:", err);
    res.status(500).json({ message: "Server error submitting interview" });
  }
});

module.exports = router;
