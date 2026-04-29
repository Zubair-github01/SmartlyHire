// client/src/CandidateAttemptsPage.js
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const API = process.env.REACT_APP_API_URL || "https://smartly-hire.vercel.app";

export default function CandidateAttemptsPage() {
  const { token } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyAttempts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/interview/my-attempts`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load attempts");
        }

        const list = data.attempts || data;
        setAttempts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMyAttempts();
  }, [token]);

  if (loading) {
    return (
      <div className="candidate-attempts-page">
        <p>Loading your interviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-attempts-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="candidate-attempts-page">
        <h2>My Interviews</h2>
        <p className="subtle">You have not completed any interviews yet.</p>
      </div>
    );
  }

  return (
    <div className="candidate-attempts-page">
      <h2>My Interviews</h2>
      <p className="subtle">
        You can see the status of each interview you’ve completed.
      </p>

      <div className="attempts-table">
        <div className="attempts-header-row">
          <span>Job</span>
          <span>Status</span>
          <span>Score</span>
          <span>Date</span>
        </div>

        {attempts.map((a) => {
          const final = a.finalReport || {};
          const scoreText =
            final.totalScore != null && final.maxScore
              ? `${final.totalScore}/${final.maxScore}`
              : "—";

          return (
            <div key={a._id} className="attempt-row">
              <span>{a.job?.title || "—"}</span>
              <span
                className={`status-pill small status-${a.status || "submitted"}`}
              >
                {a.status || "submitted"}
              </span>
              <span>{scoreText}</span>
              <span>
                {a.createdAt
                  ? new Date(a.createdAt).toLocaleString()
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
