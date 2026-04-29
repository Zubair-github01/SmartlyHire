// server/controllers/jobController.js
const Job = require("../models/Job");

// Create Job (Admin)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      numberOfQuestions,
      applicationDeadline,
      difficulty,
      questions,
    } = req.body;

    const adminId = req.user?._id || req.user?.id; // ✅ robust

    const job = await Job.create({
      title,
      description,
      requirements,
      numberOfQuestions,
      applicationDeadline,
      difficulty,
      questions,
      createdBy: adminId, // ✅ FIX
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error("createJob error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Get All Jobs (Admin + Candidate)
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
    res.json({ success: true, jobs });
  } catch (error) {
    console.error("Get jobs error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Jobs created by logged-in admin ONLY
exports.getMyJobs = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id; // ✅ FIX

    const jobs = await Job.find({ createdBy: adminId }).sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (err) {
    console.error("Error loading jobs for admin:", err);
    res.status(500).json({ success: false, message: "Error loading jobs" });
  }
};

// Get Single Job
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({ success: true, job });
  } catch (error) {
    console.error("Get job error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Job (Admin)
exports.updateJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      numberOfQuestions,
      applicationDeadline,
    } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, description, requirements, numberOfQuestions, applicationDeadline },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error("Update job error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Job (Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("Delete job error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
