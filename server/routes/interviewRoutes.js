// server/routes/interviewRoutes.js
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch"); // for /generate route

// Models
const InterviewAttempt = require("../models/InterviewAttempt");

// Controllers
const interviewController = require("../controllers/interviewController");
const {
  submitInterview,
  evaluateAttempt,
  getAttempt,
  getMyAttempts,
  getMyAttempt,
  getTopScorers
  // startAttempt may or may not exist in your controller; we will access via interviewController.startAttempt safely
} = interviewController;

// Auth middlewares
const { protect, adminOnly } = require("../middleware/auth");

/**
 * ------------------------------------
 * 1) Question Generation with Ollama
 *    POST /api/interview/generate
 * ------------------------------------
 */
router.post("/generate", async (req, res) => {
  const { jobTitle, difficulty, numberOfQuestions } = req.body;
  console.log("Generate called with:", { jobTitle, difficulty, numberOfQuestions });

  if (!jobTitle || !numberOfQuestions) {
    return res
      .status(400)
      .json({ error: "jobTitle and numberOfQuestions are required" });
  }

  const prompt = `
Generate EXACTLY ${numberOfQuestions} interview questions for a ${jobTitle}.
Difficulty: ${difficulty}

Rules:
- Return EXACTLY ${numberOfQuestions} items (no more, no less).
- Do NOT include coding questions unless explicitly requested.
- Allowed types: "text" or "mcq" only.
- For "mcq", include 4 options and keep "answer" empty.

Return JSON ONLY (no explanation), in this format:
[
  { "type": "text" | "mcq", "question": "", "options": [], "answer": "" }
]
`;


  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      console.error("Ollama HTTP error:", ollamaRes.status, text);
      return res.status(500).json({
        error: "Ollama HTTP error",
        status: ollamaRes.status,
        body: text,
      });
    }

    const ollamaJson = await ollamaRes.json();
    const output = ollamaJson.response || "";

    console.log("Ollama raw response:", output);

    const jsonStart = output.indexOf("[");
    const jsonEnd = output.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      return res.status(500).json({
        error: "Model response did not contain JSON array",
        raw: output,
      });
    }

    const jsonText = output.slice(jsonStart, jsonEnd);

    // --- ✅ Repair common Ollama JSON mistakes ---
    const repaired = jsonText
      // fix: "answer":''  ->  "answer":""
      .replace(/"answer"\s*:\s*''/g, '"answer":""')

      // fix: "answer":'text' -> "answer":"text"
      .replace(/"answer"\s*:\s*'([^']*)'/g, (m, v) => {
        const safe = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `"answer":"${safe}"`;
      })

      // remove trailing commas: { ... ,} or [ ... ,]
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    let questions;
    try {
      questions = JSON.parse(repaired);
    } catch (e) {
      console.error("JSON parse failed. Raw JSON:", jsonText);
      console.error("JSON parse failed. Repaired JSON:", repaired);
      return res.status(500).json({
        error: "Model output was not valid JSON",
        raw: output,
      });
    }

    // normalize fields so frontend never crashes
    questions = (Array.isArray(questions) ? questions : []).map((q) => ({
      type: q.type || "text",
      question: q.question || q.questionText || "",
      options: Array.isArray(q.options) ? q.options : [],
      answer: typeof q.answer === "string" ? q.answer : "",
    }));

    return res.json({ questions });

  } catch (err) {
    console.error("Generate route error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * ------------------------------------
 * 2) Candidate starts attempt (optional)
 *    POST /api/interview/start
 * ------------------------------------
 * Only enable if you actually implemented startAttempt in controller.
 */
if (typeof interviewController.startAttempt === "function") {
  router.post("/start", protect, interviewController.startAttempt);
}

/**
 * ------------------------------------
 * 3) Candidate submits interview
 *    POST /api/interview/submit
 * ------------------------------------
 */
router.post("/submit", protect, submitInterview);

/**
 * ------------------------------------
 * 4) Candidate views their own attempts
 *    GET /api/interview/my-attempts
 * ------------------------------------
 */
router.get("/my-attempts", protect, getMyAttempts);
router.get("/my-attempt/:id", protect, getMyAttempt);
// ✅ Admin leaderboard
router.get("/top-scorers", protect, adminOnly, getTopScorers);


/**
 * ------------------------------------
 * 5) Admin: list all attempts
 *    GET /api/interview/attempts
 * ------------------------------------
 */
router.get("/attempts", protect, adminOnly, async (req, res) => {
  try {
    const attempts = await InterviewAttempt.find()
      .populate({ path: "job", select: "title createdBy" })
      .populate("candidate", "name email")
      .sort({ createdAt: -1 });

    const filtered = attempts.filter(
      (a) => String(a.job?.createdBy) === String(req.user.id)
    );

    res.json({ attempts: filtered });
  } catch (err) {
    console.error("list attempts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * ------------------------------------
 * 6) Admin views a specific attempt
 *    GET /api/interview/attempt/:id
 * ------------------------------------
 */
router.get("/attempt/:id", protect, adminOnly, getAttempt);

/**
 * ------------------------------------
 * 7) Admin evaluates an attempt (AI)
 *    POST /api/interview/evaluate/:attemptId
 * ------------------------------------
 */
router.post("/evaluate/:attemptId", protect, adminOnly, evaluateAttempt);

module.exports = router;
