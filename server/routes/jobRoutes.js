// server/routes/jobRoutes.js
const express = require("express");
const router = express.Router();

const { protect, allowRoles } = require("../middleware/auth");
const {
  createJob,
  getJobs,
  getJob,
  getMyJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

// Create a new job
router.post("/", protect, allowRoles("admin"), createJob);

// ✅ MUST be before "/:id"
router.get("/my", protect, allowRoles("admin"), getMyJobs);

// Update / Delete
router.put("/:id", protect, allowRoles("admin"), updateJob);
router.delete("/:id", protect, allowRoles("admin"), deleteJob);

// Public
router.get("/", getJobs);
router.get("/:id", getJob);

module.exports = router;
