// server/controllers/interviewAttemptController.js
const InterviewAttempt = require("../models/InterviewAttempt");
const Job = require("../models/Job");

exports.getAttemptsForAdmin = async (req, res) => {
  try {
    const adminId = req.user._id;

    // 1) Find jobs created by this admin
    const jobs = await Job.find({ createdBy: adminId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    if (!jobIds.length) {
      return res.json({ attempts: [] });
    }

    // 2) Find attempts for those jobs
    const attempts = await InterviewAttempt.find({
      job: { $in: jobIds },
    })
      .populate("candidate", "name email")
      .populate("job", "title createdBy")
      .sort({ createdAt: -1 });

    // 3) Return just these attempts
    return res.json({ attempts });
  } catch (err) {
    console.error("Error loading admin attempts:", err);
    return res.status(500).json({ message: "Error loading attempts" });
  }
};
