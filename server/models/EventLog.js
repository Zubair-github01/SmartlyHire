// server/models/EventLog.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventLogSchema = new Schema({
  candidate: { type: String, required: true },
  duration: { type: Number }, // seconds
  focusLostCount: { type: Number, default: 0 },
  noFaceCount: { type: Number, default: 0 },
  multipleFacesCount: { type: Number, default: 0 },
  suspiciousObjectCount: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 100 },
  events: { type: [String], default: [] },
  // filename of the saved webm video
  videoPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EventLog", EventLogSchema);
