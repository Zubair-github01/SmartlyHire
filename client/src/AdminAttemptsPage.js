// client/src/AdminAttemptsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AdminAttemptsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttempts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/interview/attempts`, {
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

    loadAttempts();
  }, [token]);

  const goToDetail = (id) => {
    navigate(`/admin/attempt/${id}`);
  };

  if (loading) {
    return (
      <div className="admin-attempts-page">
        <p>Loading interview attempts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-attempts-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="admin-attempts-page">
        <h2>Candidate Attempts</h2>
        <p className="subtle">No interview attempts yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-attempts-page">
      <h2>Candidate Attempts</h2>
      <p className="subtle">
        View all completed interviews. Click an attempt to see the full AI
        report and proctoring details.
      </p>

      <div className="attempts-table">
        <div className="attempts-header-row">
          <span>Candidate</span>
          <span>Job</span>
          <span>Status</span>
          <span>Score</span>
          <span>Date</span>
          <span>Action</span>
        </div>

        {attempts.map((a) => (
          <div key={a._id} className="attempt-row">
            <span>{a.candidate?.name || "Unknown"}</span>
            <span>{a.job?.title || "—"}</span>
            <span
              className={`status-pill small status-${a.status || "submitted"}`}
            >
              {a.status || "submitted"}
            </span>
            <span>
              {a.evaluation?.totalScore != null
                ? a.evaluation.totalScore
                : "—"}
            </span>
            <span>
              {a.createdAt
                ? new Date(a.createdAt).toLocaleString()
                : "—"}
            </span>
            <span>
              <button
                className="small-btn"
                onClick={() => goToDetail(a._id)}
              >
                View report →
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
