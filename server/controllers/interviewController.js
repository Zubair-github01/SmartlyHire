// server/controllers/interviewController.js
const InterviewAttempt = require("../models/InterviewAttempt");
const Job = require("../models/Job");
const { callOllamaChat } = require("../utils/ollama");

// --------- Helper functions ---------
function buildEvaluationPrompt({ jobTitle, questionText, answerText }) {
  return `
You are an expert technical interviewer.

Job Title: ${jobTitle}

Question:
${questionText}

Candidate Answer:
${answerText}

Evaluate the answer on a scale of 0 to 10 (0 = completely wrong, 10 = excellent).
Return ONLY valid JSON in this exact format:

{
  "score": 0-10,
  "strengths": "bullet points or short text",
  "weaknesses": "bullet points or short text",
  "feedback": "one paragraph of overall feedback"
}
  `.trim();
}

function safeParseJson(text) {
  try {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonPart = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonPart);
    }
  } catch (e) {
    // ignore parse error
  }
  return null;
}

function buildFinalReport({ totalScore, maxScore, averageScore, integrityScore }) {
  const scoreRatio = maxScore > 0 ? totalScore / maxScore : 0;
  let verdict = "fail";

  if (integrityScore < 0.5) {
    verdict = "flagged";
  } else if (scoreRatio >= 0.7) {
    verdict = "pass";
  }

  const summary = `
Overall score: ${(scoreRatio * 100).toFixed(1)}%.
Integrity score: ${(integrityScore * 100).toFixed(1)}%.

Verdict: ${verdict.toUpperCase()}.
`.trim();

  return {
    totalScore,
    maxScore,
    averageScore,
    integrityScore,
    verdict,
    summary,
  };
}
// ✅ Admin: Top scorers from active jobs
exports.getTopScorers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 20);
    const now = new Date();

    const InterviewAttempt = require("../models/InterviewAttempt");

    // Get evaluated attempts (AI done)
    const attempts = await InterviewAttempt.find({ status: "evaluated" })
      .populate("candidate", "name email")
      .populate("job", "title applicationDeadline")
      .sort({ createdAt: -1 })
      .limit(200); // scan last 200 evaluated attempts

    // Only keep "active hirings" (deadline not passed). If deadline missing, keep it.
    const active = attempts.filter((a) => {
      const dl = a?.job?.applicationDeadline;
      if (!dl) return true;
      return new Date(dl) >= now;
    });

    const scored = active
      .map((a) => {
        const totalScore = a?.finalReport?.totalScore ?? a?.evaluation?.totalScore ?? 0;
        const maxScore = a?.finalReport?.maxScore ?? 0;
        const aiPct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        // Prefer proctoring.integrityScore (0..100). Fallback to finalReport.integrityScore (0..1).
        let integrityPct = 100;
        if (typeof a?.proctoring?.integrityScore === "number") integrityPct = a.proctoring.integrityScore;
        else if (typeof a?.finalReport?.integrityScore === "number") integrityPct = a.finalReport.integrityScore * 100;

        // Composite score (tune weights if you want)
        const composite = (aiPct * 0.7) + (integrityPct * 0.3);

        return {
          attemptId: a._id,
          candidate: a.candidate,
          job: a.job,
          aiPct: Math.round(aiPct),
          integrityPct: Math.round(integrityPct),
          composite: Math.round(composite),
          verdict: a?.finalReport?.verdict || "—",
          createdAt: a.createdAt,
        };
      })
      .sort((x, y) => y.composite - x.composite)
      .slice(0, limit);

    return res.json({ success: true, top: scored });
  } catch (err) {
    console.error("getTopScorers error:", err);
    return res.status(500).json({ message: "Failed to load top scorers" });
  }
};


// --------- CONTROLLERS ---------

// Candidate submits interview
// POST /api/interview/submit
exports.submitInterview = async (req, res) => {
  try {
    const { jobId, answers, attemptId } = req.body;

    if (!jobId || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ message: "jobId and answers[] are required" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ If frontend sends attemptId (recommended), update that attempt instead of creating a new one
    let attempt = null;

    if (attemptId) {
      attempt = await InterviewAttempt.findOne({
        _id: attemptId,
        candidate: req.user.id,
        job: jobId,
      });

      if (attempt) {
        attempt.answers = answers;
        attempt.status = "submitted";

        // ✅ End proctoring session at submit time
        attempt.proctoring = attempt.proctoring || {};
        attempt.proctoring.endedAt = new Date();

        // ✅ If proctoring sometimes stores 0-100, normalize to 0-1 for finalReport later
        if (typeof attempt.proctoring.integrityScore === "number") {
          const v = attempt.proctoring.integrityScore;
          // if score looks like 0-100, convert to 0-1
          attempt.proctoring.integrityScore = v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v));
        }

        await attempt.save();
        return res.status(200).json({ message: "Interview submitted", attempt });
      }
      // if attemptId was provided but not found, fallback to create below
    }

    // ✅ Fallback: create a new attempt
    attempt = await InterviewAttempt.create({
      candidate: req.user.id,
      job: jobId,
      answers,
      status: "submitted",
      // ✅ End proctoring (even if no heartbeat arrived)
      proctoring: {
        endedAt: new Date(),
      },
    });

    return res.status(201).json({ message: "Interview submitted", attempt });
  } catch (err) {
    console.error("submitInterview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin evaluates an attempt with AI
// POST /api/interview/evaluate/:attemptId
exports.evaluateAttempt = async (req, res) => {
  const { attemptId } = req.params;
  const model = process.env.OLLAMA_EVAL_MODEL || "llama3";

  try {
    const attempt = await InterviewAttempt.findById(attemptId)
      .populate("job", "title description")
      .populate("candidate", "name email");

    if (!attempt) {
      return res.status(404).json({ message: "Interview attempt not found" });
    }

    if (attempt.status === "evaluated") {
      return res.json({ message: "Already evaluated", attempt });
    }

    const perQuestion = [];
    const maxPerQuestion = 10;

    for (let i = 0; i < attempt.answers.length; i++) {
      const ans = attempt.answers[i];
      const questionText = ans.questionText || `Question #${i + 1}`;
      const answerText = ans.answerText || ans.codeAnswer || "(no answer)";

      const userPrompt = buildEvaluationPrompt({
        jobTitle: attempt.job?.title || "Unknown Role",
        questionText,
        answerText,
      });

      const raw = await callOllamaChat({
        model,
        systemPrompt: "You are a strict but fair technical interviewer.",
        userPrompt,
      });

      const parsed = safeParseJson(raw) || {};
      const score = Math.min(
        maxPerQuestion,
        Math.max(0, Number(parsed.score) || 0)
      );

      // Ensure we always store strings (schema expects String)
      const strengths =
        Array.isArray(parsed.strengths)
          ? parsed.strengths.join(" • ")
          : parsed.strengths || "";

      const weaknesses =
        Array.isArray(parsed.weaknesses)
          ? parsed.weaknesses.join(" • ")
          : parsed.weaknesses || "";

      const feedback =
        Array.isArray(parsed.feedback)
          ? parsed.feedback.join(" ")
          : parsed.feedback || "";

      perQuestion.push({
        questionIndex: i,
        score,
        strengths,
        weaknesses,
        feedback,
      });

    }

    const totalScore = perQuestion.reduce((sum, q) => sum + (q.score || 0), 0);
    const maxScore = maxPerQuestion * perQuestion.length;
    const averageScore =
      perQuestion.length > 0 ? totalScore / perQuestion.length : 0;

    // TODO: integrate real integrityScore from EventLog/proctoring.
    // ✅ take integrity from live proctoring (0..100) and normalize to 0..1
    const liveIntegrity100 =
      typeof attempt.proctoring?.integrityScore === "number"
        ? attempt.proctoring.integrityScore
        : 100;

    const integrityScore = Math.max(0, Math.min(1, liveIntegrity100 / 100));


    const finalReport = buildFinalReport({
      totalScore,
      maxScore,
      averageScore,
      integrityScore,
    });

    attempt.evaluation = {
      model,
      perQuestion,
      totalScore,
      evaluatedAt: new Date(),
    };
    attempt.finalReport = finalReport;
    attempt.status = "evaluated";

    await attempt.save();

    return res.json({
      message: "Interview evaluated successfully",
      attempt,
    });
  } catch (err) {
    console.error("Error evaluating attempt:", err);
    return res.status(500).json({ message: "Error evaluating attempt" });
  }
};

// Admin or candidate reads single attempt
// GET /api/interview/attempt/:id  (admin route in our router)
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await InterviewAttempt.findById(req.params.id)
      .populate("job", "title description")
      .populate("candidate", "name email");

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    res.json({ attempt });
  } catch (err) {
    console.error("getAttempt error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Candidate gets their own attempts
// GET /api/interview/my-attempts
// POST /api/interview/submit
exports.submitInterview = async (req, res) => {
  try {
    const { jobId, answers, attemptId } = req.body;

    if (!jobId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "jobId and answers[] are required" });
    }

    const Job = require("../models/Job");
    const InterviewAttempt = require("../models/InterviewAttempt");

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    let attempt;

    // ✅ Correct path: update existing attempt so proctoring is preserved
    if (attemptId) {
      attempt = await InterviewAttempt.findOneAndUpdate(
        { _id: attemptId, candidate: req.user.id, job: jobId },
        {
          $set: {
            answers,
            status: "submitted",
            "proctoring.endedAt": new Date(),
          },
        },
        { new: true }
      );

      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found for submit" });
      }
    } else {
      // fallback: create attempt (but proctoring will not exist)
      attempt = await InterviewAttempt.create({
        candidate: req.user.id,
        job: jobId,
        answers,
        status: "submitted",
        proctoring: { endedAt: new Date(), integrityScore: 100 },
      });
    }

    return res.json({ success: true, attempt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "submitInterview failed" });
  }
};



exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await InterviewAttempt.find({ candidate: req.user.id })
      .populate("job", "title")
      .sort({ createdAt: -1 });

    res.json({ attempts });
  } catch (err) {
    console.error("getMyAttempts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// POST /api/interview/start
exports.startAttempt = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ message: "jobId required" });

    const Job = require("../models/Job");
    const InterviewAttempt = require("../models/InterviewAttempt");

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const attempt = await InterviewAttempt.create({
      candidate: req.user.id,
      job: jobId,
      answers: [],
      status: "in_progress",
      proctoring: { startedAt: new Date(), integrityScore: 100 },
    });

    return res.json({ success: true, attemptId: attempt._id });
  } catch (err) {
    console.error("startAttempt failed:", err);
    return res.status(500).json({ message: "startAttempt failed" });
  }
};

// Candidate reads ONE of their own attempts
// GET /api/interview/my-attempt/:id
exports.getMyAttempt = async (req, res) => {
  try {
    const attempt = await InterviewAttempt.findById(req.params.id)
      .populate("job", "title description")
      .populate("candidate", "name email");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Only owner candidate can view
    if (String(attempt.candidate?._id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.json({ attempt });
  } catch (err) {
    console.error("getMyAttempt error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
