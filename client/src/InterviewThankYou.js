// client/src/InterviewThankYou.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./InterviewThankYou.css";

export default function InterviewThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = location?.state?.attemptId;

  return (
    <div className="ty-page">
      <div className="ty-shell">
        <div className="ty-card">
          <div className="ty-badge">✓</div>

          <h1 className="ty-title">Interview submitted</h1>
          <p className="ty-sub">
            Your answers were submitted successfully. You’ll see updates when the evaluation is completed.
          </p>

          {attemptId && (
            <div className="ty-attempt">
              <span className="ty-attempt-label">Attempt ID</span>
              <span className="ty-attempt-value">{attemptId}</span>
            </div>
          )}

          <div className="ty-actions">
            <button className="ty-btn ghost" onClick={() => navigate("/candidate/jobs")}>
              Back to Job List
            </button>
            <button className="ty-btn primary" onClick={() => navigate("/candidate")}>
              Go to Dashboard →
            </button>
          </div>

          <div className="ty-foot">
            Tip: Keep an eye on your dashboard for integrity score and interview status.
          </div>
        </div>
      </div>
    </div>
  );
}
