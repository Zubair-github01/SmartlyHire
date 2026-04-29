import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./CandidateAttemptDetail.css";

const API = process.env.REACT_APP_API_URL || "https://smartly-hire.vercel.app";

export default function CandidateAttemptDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await fetch(`${API}/api/interview/my-attempt/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load report");

        setAttempt(data.attempt);
      } catch (e) {
        setErr(e.message || "Error loading report");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  if (loading) return <div className="cand-detail-shell">Loading…</div>;
  if (err) return <div className="cand-detail-shell cand-error">{err}</div>;
  if (!attempt) return <div className="cand-detail-shell">Not found</div>;

  const report = attempt.finalReport || {};
  const perQ = attempt.evaluation?.perQuestion || [];

  return (
    <div className="cand-detail-shell">
      <div className="cand-detail-head">
        <div>
          <h1 className="cand-detail-title">Interview Report</h1>
          <p className="muted">
            Job: <strong>{attempt?.job?.title || "—"}</strong> • Status:{" "}
            <strong>{attempt.status}</strong>
          </p>
        </div>

        <div className="cand-detail-actions">
          <button className="cand-btn ghost" onClick={() => navigate("/candidate")}>
            ← Back
          </button>
          <button className="cand-btn" onClick={() => navigate("/candidate/jobs")}>
            Jobs →
          </button>
        </div>
      </div>

      <div className="cand-detail-cards">
        <div className="cand-detail-card">
          <div className="label">Score</div>
          <div className="value">
            {typeof report.totalScore === "number" && typeof report.maxScore === "number"
              ? `${report.totalScore}/${report.maxScore}`
              : "—"}
          </div>
          <div className="muted small">
            {report.maxScore ? `${((report.totalScore / report.maxScore) * 100).toFixed(1)}%` : ""}
          </div>
        </div>

        <div className="cand-detail-card">
          <div className="label">Verdict</div>
          <div className="value">{report.verdict ? report.verdict.toUpperCase() : "—"}</div>
          <div className="muted small">Based on evaluation + integrity</div>
        </div>

        <div className="cand-detail-card">
          <div className="label">Integrity</div>
          <div className="value">
            {typeof report.integrityScore === "number"
              ? `${(report.integrityScore * 100).toFixed(1)}%`
              : "N/A"}
          </div>
          <div className="muted small">Proctoring score (if enabled)</div>
        </div>
      </div>

      <div className="cand-detail-report">
        <h2>Summary</h2>
        <p className="muted">{report.summary || "No summary available."}</p>
      </div>

      <div className="cand-detail-report">
        <h2>Per-question breakdown</h2>

        {perQ.length === 0 && <p className="muted">No evaluation yet.</p>}

        {perQ.map((q, idx) => (
          <div className="cand-qcard" key={idx}>
            <div className="cand-qhead">
              <div className="qidx">Q{(q.questionIndex ?? idx) + 1}</div>
              <div className="qscore">{q.score}/10</div>
            </div>
            <div className="qblock">
              <div className="label">Strengths</div>
              <div className="text">{q.strengths || "—"}</div>
            </div>
            <div className="qblock">
              <div className="label">Weaknesses</div>
              <div className="text">{q.weaknesses || "—"}</div>
            </div>
            <div className="qblock">
              <div className="label">Feedback</div>
              <div className="text">{q.feedback || "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
