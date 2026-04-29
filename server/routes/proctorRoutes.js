// server/routes/proctorRoutes.js
const router = require("express").Router();
const { heartbeat } = require("../controllers/proctorController");

// (Optional) you can protect this route later with auth middleware
router.post("/heartbeat", heartbeat);

module.exports = router;
