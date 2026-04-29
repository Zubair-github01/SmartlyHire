// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const EventLog = require("./models/EventLog");
const interviewRoutes = require("./routes/interviewRoutes");
const interviewAnswerRoutes = require("./routes/interviewAnswerRoutes");
const proctorRoutes = require("./routes/proctorRoutes");


// Load .env
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;


// ---------- Middleware ----------
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "https://smartly-hire-j6hg.vercel.app/"], // React or Vite
    credentials: true,
  }));
app.use(express.json());

// Static folder for uploaded videos
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ---------- Multer setup for video upload ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safeName}${ext === ".webm" ? "" : ".webm"}`);
  }
});

const upload = multer({ storage });

// ---------- Modular Routes ----------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/interview", interviewRoutes);
app.use("/api/interview", interviewAnswerRoutes);
app.use("/api/proctor", proctorRoutes);

// ---------- Proctoring Upload & Report System ----------

// POST /api/upload
// expects multipart/form-data:
//   video: webm file
//   report: JSON string with candidate, duration, counts, integrityScore, events[]
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    const reportRaw = req.body.report;
    let reportData = {};

    try {
      reportData = reportRaw ? JSON.parse(reportRaw) : {};
    } catch (err) {
      console.error("Failed to parse report JSON:", err.message);
      return res.status(400).json({ success: false, message: "Invalid report JSON" });
    }

    const videoFile = req.file;

    const eventLog = await EventLog.create({
      candidate: reportData.candidate || "Unknown candidate",
      duration: reportData.duration || 0,
      focusLostCount: reportData.focusLostCount || 0,
      noFaceCount: reportData.noFaceCount || 0,
      multipleFacesCount: reportData.multipleFacesCount || 0,
      suspiciousObjectCount: reportData.suspiciousObjectCount || 0,
      integrityScore: reportData.integrityScore ?? 100,
      events: reportData.events || [],
      videoPath: videoFile ? videoFile.filename : null
    });

    console.log("Video saved at:", videoFile && videoFile.path);
    console.log("Report saved with _id:", eventLog._id);

    return res.json({
      success: true,
      message: "Video & report uploaded successfully",
      report: eventLog
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    return res.status(500).json({ success: false, message: "Server error during upload" });
  }
});

// GET /api/reports
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await EventLog.find().sort({ createdAt: -1 });
    // Dashboard already expects the same field names, so we can return directly
    res.json(reports);
  } catch (err) {
    console.error("Fetch reports error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
});

// ---------- Start backend server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
