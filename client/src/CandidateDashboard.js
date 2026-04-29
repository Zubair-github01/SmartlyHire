import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./CandidateDashboard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function toDateTime(v) {
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function scoreText(attempt) {
  const total = attempt?.finalReport?.totalScore;
  const max = attempt?.finalReport?.maxScore;
  if (typeof total === "number" && typeof max === "number" && max > 0) {
    const pct = ((total / max) * 100).toFixed(1);
    return `${total}/${max} (${pct}%)`;
  }
  if (typeof attempt?.evaluation?.totalScore === "number") {
    return `${attempt.evaluation.totalScore}`;
  }
  return "—";
}

export default function CandidateDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchAttempts = async () => {
    try {
      setErr("");
      setLoading(true);

      const res = await fetch(`${API}/api/interview/my-attempts`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attempts");

      const list = data.attempts || [];
      setAttempts(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e.message || "Error loading attempts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const stats = useMemo(() => {
    const total = attempts.length;
    const evaluated = attempts.filter((a) => a.status === "evaluated").length;
    const submitted = attempts.filter((a) => a.status === "submitted").length;

    // quick average percent (only evaluated with finalReport)
    const evalWithScore = attempts.filter(
      (a) =>
        a.status === "evaluated" &&
        typeof a?.finalReport?.totalScore === "number" &&
        typeof a?.finalReport?.maxScore === "number" &&
        a.finalReport.maxScore > 0
    );

    let avgPct = null;
    if (evalWithScore.length) {
      const sum = evalWithScore.reduce(
        (acc, a) => acc + a.finalReport.totalScore / a.finalReport.maxScore,
        0
      );
      avgPct = (sum / evalWithScore.length) * 100;
    }

    const latest = attempts[0];
    return { total, evaluated, submitted, avgPct, latest };
  }, [attempts]);

  return (
    <div className="candidate-page">
      <div className="candidate-shell">
        <div className="candidate-head">
          <div>
            <h1 className="candidate-title">Candidate Dashboard</h1>
            <p className="candidate-sub">
              {user?.name ? `Welcome, ${user.name}. ` : "Welcome. "}
              View your interview attempts and results here.
            </p>
          </div>

          <div className="candidate-actions">
            <button
              className="cand-btn"
              onClick={() => navigate("/candidate/jobs")}
            >
              Browse Jobs →
            </button>
            <button className="cand-btn ghost" onClick={fetchAttempts}>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="cand-stats">
          <div className="cand-stat">
            <div className="cand-stat-label">Total Attempts</div>
            <div className="cand-stat-value">{stats.total}</div>
            <div className="cand-stat-foot">All interviews you submitted</div>
          </div>

          <div className="cand-stat">
            <div className="cand-stat-label">Evaluated</div>
            <div className="cand-stat-value">{stats.evaluated}</div>
            <div className="cand-stat-foot">AI evaluation completed</div>
          </div>

          <div className="cand-stat">
            <div className="cand-stat-label">Submitted (Pending)</div>
            <div className="cand-stat-value">{stats.submitted}</div>
            <div className="cand-stat-foot">Waiting for evaluation</div>
          </div>

          <div className="cand-stat">
            <div className="cand-stat-label">Average Score</div>
            <div className="cand-stat-value">
              {typeof stats.avgPct === "number" ? `${stats.avgPct.toFixed(1)}%` : "—"}
            </div>
            <div className="cand-stat-foot">Only evaluated attempts</div>
          </div>
        </div>

        {/* Latest */}
        {stats.latest && (
          <div className="cand-latest">
            <div className="cand-latest-left">
              <div className="cand-latest-title">Latest Attempt</div>
              <div className="cand-latest-line">
                <span className="muted">Job:</span>{" "}
                <strong>{stats.latest?.job?.title || "—"}</strong>
              </div>
              <div className="cand-latest-line">
                <span className="muted">Status:</span>{" "}
                <span className={`pill ${stats.latest.status}`}>
                  {stats.latest.status}
                </span>
              </div>
              <div className="cand-latest-line">
                <span className="muted">Score:</span>{" "}
                <strong>{scoreText(stats.latest)}</strong>
              </div>
              <div className="cand-latest-line">
                <span className="muted">Date:</span>{" "}
                <span>{toDateTime(stats.latest.createdAt)}</span>
              </div>
            </div>

            <div className="cand-latest-right">
              <button
                className="cand-btn"
                onClick={() => navigate(`/candidate/attempt/${stats.latest._id}`)}
              >
                View Result →
              </button>
            </div>
          </div>
        )}

        {/* Attempts table */}
        <div className="cand-card">
          <div className="cand-card-head">
            <h2>Your Attempts</h2>
            <p className="muted">
              Click an attempt to open the detailed report.
            </p>
          </div>

          {loading && <p className="muted">Loading attempts…</p>}
          {err && <p className="cand-error">{err}</p>}

          {!loading && !err && attempts.length === 0 && (
            <div className="cand-empty">
              <div className="cand-empty-title">No attempts yet</div>
              <div className="muted">
                Go to Jobs and start your first interview.
              </div>
              <button
                className="cand-btn"
                onClick={() => navigate("/candidate/jobs")}
                style={{ marginTop: 12 }}
              >
                Go to Jobs →
              </button>
            </div>
          )}

          {!loading && !err && attempts.length > 0 && (
            <div className="cand-table">
              <div className="cand-row head">
                <div>Job</div>
                <div>Status</div>
                <div>Score</div>
                <div>Date</div>
                <div></div>
              </div>

              {attempts.map((a) => (
                <div className="cand-row" key={a._id}>
                  <div className="job">{a?.job?.title || "—"}</div>
                  <div>
                    <span className={`pill ${a.status}`}>{a.status}</span>
                    {a?.finalReport?.verdict && (
                      <span className={`pill verdict ${a.finalReport.verdict}`}>
                        {a.finalReport.verdict}
                      </span>
                    )}
                  </div>
                  <div className="score">{scoreText(a)}</div>
                  <div className="date">{toDateTime(a.createdAt)}</div>
                  <div className="action">
                    <button
                      className="cand-btn small"
                      onClick={() => navigate(`/candidate/attempt/${a._id}`)}
                    >
                      Open →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cand-foot-note muted">
          Camera/proctoring only appears when you start an interview from Jobs.
        </div>
      </div>
    </div>
  );
}
