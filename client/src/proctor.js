// client/src/proctor.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Proctor.css";

// ✅ FIX: define API base once (this was causing: API_BASE is not defined)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Proctor({
  autoStart = false,
  candidateName = "",
  hideControls = false,
  attemptId = null,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [candidateLocal, setCandidateLocal] = useState("");
  const [running, setRunning] = useState(false);
  const [uiError, setUiError] = useState("");

  const [logLines, setLogLines] = useState([]);

  const [focusLostCount, setFocusLostCount] = useState(0);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [multipleFacesCount, setMultipleFacesCount] = useState(0);
  const [suspiciousObjectCount, setSuspiciousObjectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Debug
  const [faceReady, setFaceReady] = useState(false);
  const [cocoReady, setCocoReady] = useState(false);
  const [lastFacesCount, setLastFacesCount] = useState(0);
  const [lastPredCount, setLastPredCount] = useState(0);

  const cocoModelRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  const eventsRef = useRef([]);
  const sessionStartRef = useRef(null);

  // detection config (tuned so you SEE score move while testing)
  const LOOK_AWAY_THRESHOLD = 2000;
  const NO_FACE_THRESHOLD = 3000;
  const LOOK_AWAY_X_DELTA = 0.035;

  const lastFaceTimeRef = useRef(Date.now());
  const lastLookAwayTimeRef = useRef(null);

  // cooldown
  const lastEventAtRef = useRef({});
  const COOLDOWN_MS = {
    no_face: 2500,
    look_away: 2500,
    multiple_faces: 3500,
    phone: 3000,
    book: 3000,
    paper: 3000,
  };

  const resolvedCandidateName = useMemo(() => {
    const fromProp = (candidateName || "").trim();
    if (fromProp) return fromProp;
    return (candidateLocal || "").trim();
  }, [candidateName, candidateLocal]);

  const shouldLog = (key, cooldown = 2500) => {
    const now = Date.now();
    const last = lastEventAtRef.current[key] || 0;
    if (now - last < cooldown) return false;
    lastEventAtRef.current[key] = now;
    return true;
  };

  const logEvent = (type, detail) => {
    const ts = new Date().toISOString();
    const msg = `${ts} | ${type} | ${detail}`;
    setLogLines((lines) => [msg, ...lines].slice(0, 300));
    eventsRef.current = [msg, ...eventsRef.current].slice(0, 300);

    if (detail.includes("user_looking_away")) setFocusLostCount((v) => v + 1);
    if (detail.includes("no_face_present")) setNoFaceCount((v) => v + 1);
    if (detail.includes("multiple_faces_detected")) setMultipleFacesCount((v) => v + 1);
    if (detail.includes("cell phone") || detail.includes("book") || detail.includes("paper")) {
      setSuspiciousObjectCount((v) => v + 1);
    }
  };

  const integrityScore = useMemo(() => {
    const penalty =
      focusLostCount * 6 +
      noFaceCount * 10 +
      multipleFacesCount * 25 +
      suspiciousObjectCount * 18;

    return Math.max(0, Math.min(100, 100 - penalty));
  }, [focusLostCount, noFaceCount, multipleFacesCount, suspiciousObjectCount]);

  const resetSessionStats = () => {
    setFocusLostCount(0);
    setNoFaceCount(0);
    setMultipleFacesCount(0);
    setSuspiciousObjectCount(0);
    setElapsedSec(0);
    setLastFacesCount(0);
    setLastPredCount(0);

    eventsRef.current = [];
    setLogLines([]);
    lastEventAtRef.current = {};

    lastFaceTimeRef.current = Date.now();
    lastLookAwayTimeRef.current = null;
  };

  const onFaceResults = (results) => {
    const faces = results?.multiFaceLandmarks || [];
    setLastFacesCount(faces.length);

    const now = Date.now();

    if (!faces.length) {
      if (now - lastFaceTimeRef.current > NO_FACE_THRESHOLD) {
        if (shouldLog("no_face", COOLDOWN_MS.no_face)) {
          logEvent("suspicious", `no_face_present_>${NO_FACE_THRESHOLD / 1000}s`);
        }
      }
      return;
    }

    lastFaceTimeRef.current = now;

    // look away
    const lm = faces[0];
    const leftEye = lm[33];
    const rightEye = lm[263];
    const nose = lm[1];

    const midEyeX = (leftEye.x + rightEye.x) / 2;

    if (Math.abs(midEyeX - nose.x) > LOOK_AWAY_X_DELTA) {
      if (!lastLookAwayTimeRef.current) lastLookAwayTimeRef.current = now;
      else if (now - lastLookAwayTimeRef.current > LOOK_AWAY_THRESHOLD) {
        if (shouldLog("look_away", COOLDOWN_MS.look_away)) {
          logEvent("suspicious", `user_looking_away_>${LOOK_AWAY_THRESHOLD / 1000}s`);
        }
        lastLookAwayTimeRef.current = now;
      }
    } else {
      lastLookAwayTimeRef.current = null;
    }

    if (faces.length > 1) {
      if (shouldLog("multiple_faces", COOLDOWN_MS.multiple_faces)) {
        logEvent("suspicious", "multiple_faces_detected");
      }
    }
  };

  const loadModels = async () => {
    setUiError("");

    // coco
    if (!cocoModelRef.current) {
      if (!window.cocoSsd) {
        setUiError("coco-ssd not found. Check index.html scripts.");
      } else {
        cocoModelRef.current = await window.cocoSsd.load();
        setCocoReady(true);
        logEvent("model", "coco-ssd loaded");
      }
    } else {
      setCocoReady(true);
    }

    // FaceMesh
    if (!faceMeshRef.current) {
      if (!window.FaceMesh) {
        setUiError("FaceMesh not found. Check index.html scripts.");
      } else {
        const fm = new window.FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        fm.setOptions({
          maxNumFaces: 2,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        fm.onResults(onFaceResults);
        faceMeshRef.current = fm;
        setFaceReady(true);
        logEvent("model", "FaceMesh loaded");
      }
    } else {
      setFaceReady(true);
    }
  };

  // coco detection (throttled)
  const lastObjAtRef = useRef(0);
  const OBJ_INTERVAL = 650;

  const runCoco = async () => {
    if (!cocoModelRef.current || !videoRef.current || !canvasRef.current) return;

    const now = Date.now();
    if (now - lastObjAtRef.current < OBJ_INTERVAL) return;
    lastObjAtRef.current = now;

    const preds = await cocoModelRef.current.detect(videoRef.current);
    setLastPredCount(preds.length);

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    preds.forEach((pred) => {
      const [x, y, w, h] = pred.bbox;

      ctx.strokeStyle = "rgba(255,80,80,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "rgba(255,80,80,0.95)";
      ctx.font = "14px system-ui";
      ctx.fillText(
        `${pred.class} ${(pred.score * 100).toFixed(0)}%`,
        x,
        Math.max(14, y - 6)
      );

      const scoreOK = pred.score >= 0.45;
      if (scoreOK && ["cell phone", "book", "paper"].includes(pred.class)) {
        const key = pred.class === "cell phone" ? "phone" : pred.class;
        if (shouldLog(key, COOLDOWN_MS[key] || 3000)) {
          logEvent("suspicious", `${pred.class}_detected`);
        }
      }
    });
  };

  const startSession = async () => {
    const name = resolvedCandidateName;
    setUiError("");

    if (!name) {
      setUiError("Please enter candidate name before starting.");
      return;
    }
    if (running) return;

    // must have camera_utils loaded
    if (!window.Camera) {
      setUiError(
        "camera_utils not found. Add camera_utils script in public/index.html."
      );
      return;
    }

    resetSessionStats();
    await loadModels();

    if (!videoRef.current) {
      setUiError("Video element not ready.");
      return;
    }

    // Ensure canvas size matches
    if (canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    sessionStartRef.current = Date.now();
    setRunning(true);
    logEvent("session", `started for ${name}`);

    // IMPORTANT: Camera utils drives frames for FaceMesh reliably
    cameraRef.current = new window.Camera(videoRef.current, {
      width: 640,
      height: 480,
      onFrame: async () => {
        if (!faceMeshRef.current || !videoRef.current) return;

        try {
          await faceMeshRef.current.send({ image: videoRef.current });
          await runCoco();
        } catch (e) {
          console.error("onFrame error:", e);
        }
      },
    });

    cameraRef.current.start();
  };

  const stopSession = async () => {
    if (!running) return;

    setRunning(false);

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    logEvent("session", "stopped");
  };

  // elapsed ticker
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (sessionStartRef.current) {
        setElapsedSec(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(id);
  }, [running]);

  /**
   * ✅ Heartbeat to server (every 2s)
   * IMPORTANT: do NOT include logLines as dependency, otherwise interval restarts constantly.
   */
  const latestHeartbeatRef = useRef({
    integrityScore: 100,
    focusLostCount: 0,
    noFaceCount: 0,
    multipleFacesCount: 0,
    suspiciousObjectCount: 0,
    events: [],
  });

  // keep latest values in a ref (no interval restarts)
  useEffect(() => {
    latestHeartbeatRef.current = {
      integrityScore,
      focusLostCount,
      noFaceCount,
      multipleFacesCount,
      suspiciousObjectCount,
      events: logLines.slice(0, 10),
    };
  }, [
    integrityScore,
    focusLostCount,
    noFaceCount,
    multipleFacesCount,
    suspiciousObjectCount,
    logLines,
  ]);

  useEffect(() => {
    if (!running) return;
    if (!attemptId) return;

    const sendHeartbeat = async () => {
      try {
        const payload = latestHeartbeatRef.current;

        await fetch(`${API_BASE}/api/proctor/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, payload }),
        });
      } catch (e) {
        // silent
      }
    };

    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 2000);
    return () => clearInterval(id);
  }, [running, attemptId]);

  // autoStart support
  const autoAttemptedRef = useRef(false);
  const lastAutoNameRef = useRef("");

  useEffect(() => {
    if (!autoStart) {
      autoAttemptedRef.current = false;
      lastAutoNameRef.current = "";
      return;
    }

    if (resolvedCandidateName && resolvedCandidateName !== lastAutoNameRef.current) {
      autoAttemptedRef.current = false;
      lastAutoNameRef.current = resolvedCandidateName;
    }

    if (autoAttemptedRef.current) return;
    if (running) return;
    if (!resolvedCandidateName) return;

    autoAttemptedRef.current = true;
    startSession();
  }, [autoStart, resolvedCandidateName, running]);

  // cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, []);

  return (
    <div className="candidate-session">
      {!hideControls && (
        <div className="input-buttons">
          <label>
            Candidate Name:
            <input
              className="candidate-input"
              value={candidateName ? candidateName : candidateLocal}
              onChange={(e) => setCandidateLocal(e.target.value)}
              placeholder="Enter Name"
              disabled={!!candidateName}
            />
          </label>

          <button className="session-button" onClick={startSession} disabled={running}>
            Start
          </button>

          <button className="session-button" onClick={stopSession} disabled={!running}>
            Stop
          </button>
        </div>
      )}

      {uiError && <div className="proctor-error">{uiError}</div>}

      <div className="camera-container">
        <video
          ref={videoRef}
          width={640}
          height={480}
          playsInline
          muted
          className="camera-video"
        />
        <canvas ref={canvasRef} width={640} height={480} className="camera-canvas" />
      </div>

      <div className="report-summary">
        <p>Interview Duration: {running ? elapsedSec : 0} sec</p>
        <p>Focus Lost: {focusLostCount} times</p>
        <p>No Face Detected: {noFaceCount} times</p>
        <p>Multiple Faces Detected: {multipleFacesCount} times</p>
        <p>Suspicious Objects Detected: {suspiciousObjectCount} times</p>
        <p>
          Integrity Score:{" "}
          <strong
            style={{
              color:
                integrityScore >= 80 ? "#4ade80" : integrityScore >= 60 ? "#fbbf24" : "#f87171",
            }}
          >
            {integrityScore}
          </strong>
        </p>

        {/* Debug (optional): remove later */}
        <p style={{ opacity: 0.75, fontSize: 12 }}>
          Debug: FaceMesh {faceReady ? "✅" : "❌"} | Coco {cocoReady ? "✅" : "❌"} | faces:{" "}
          {lastFacesCount} | preds: {lastPredCount}
        </p>
      </div>

      <div className="event-log">
        <strong>Event Log</strong>
        <div id="log">
          {logLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
