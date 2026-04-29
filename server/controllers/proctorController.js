// server/controllers/proctorController.js
const InterviewAttempt = require("../models/InterviewAttempt");

exports.heartbeat = async (req, res) => {
  try {
    const { attemptId, payload } = req.body;

    if (!attemptId) {
      return res.status(400).json({ message: "attemptId required" });
    }

    // ✅ basic payload safety (prevents crash if payload is missing/wrong)
    if (payload && typeof payload !== "object") {
      return res.status(400).json({ message: "payload must be an object" });
    }

    const update = {
      "proctoring.lastHeartbeatAt": new Date(),
    };

    // ✅ Optional: set startedAt on first heartbeat (if not already set)
    // This helps admin view timeline, but it won't break anything if you don't use it.
    if (!payload?.endedAt) {
      update["proctoring.startedAt"] = update["proctoring.startedAt"]; // placeholder (removed below if undefined)
    }

    if (payload && typeof payload.integrityScore === "number") {
      update["proctoring.integrityScore"] = payload.integrityScore;
    }
    if (typeof payload?.focusLostCount === "number")
      update["proctoring.focusLostCount"] = payload.focusLostCount;
    if (typeof payload?.noFaceCount === "number")
      update["proctoring.noFaceCount"] = payload.noFaceCount;
    if (typeof payload?.multipleFacesCount === "number")
      update["proctoring.multipleFacesCount"] = payload.multipleFacesCount;
    if (typeof payload?.suspiciousObjectCount === "number")
      update["proctoring.suspiciousObjectCount"] = payload.suspiciousObjectCount;

    // ✅ Optional: if frontend sends endedAt, store it
    if (payload?.endedAt) {
      const d = new Date(payload.endedAt);
      if (!isNaN(d.getTime())) update["proctoring.endedAt"] = d;
    }

    // ✅ Remove any accidental undefined updates
    Object.keys(update).forEach((k) => {
      if (update[k] === undefined) delete update[k];
    });

    // ✅ Ensure startedAt is only set once (first heartbeat)
    // If you want this feature, it will work even if you don't currently send startedAt.
    if (!payload?.endedAt) {
      const attempt = await InterviewAttempt.findById(attemptId).select("proctoring.startedAt");
      if (attempt && !attempt?.proctoring?.startedAt) {
        update["proctoring.startedAt"] = new Date();
      } else {
        delete update["proctoring.startedAt"];
      }
    } else {
      delete update["proctoring.startedAt"];
    }

    // keep last 300 events
    if (Array.isArray(payload?.events) && payload.events.length) {
      await InterviewAttempt.updateOne(
        { _id: attemptId },
        {
          $set: update,
          $push: {
            "proctoring.events": { $each: payload.events, $slice: -300 },
          },
        }
      );
    } else {
      await InterviewAttempt.updateOne({ _id: attemptId }, { $set: update });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("heartbeat failed:", e);
    return res.status(500).json({ message: "heartbeat failed" });
  }
};
