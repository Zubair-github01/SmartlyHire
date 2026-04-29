// client/src/AdminAttemptDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

const API = process.env.REACT_APP_API_URL || "https://smartly-hire.vercel.app";

export default function AdminAttemptDetail() {
  const { attemptId } = useParams();
  const { token } = useAuth();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const loadAttempt = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/interview/attempt/${attemptId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load attempt");
      }

      setAttempt(data.attempt || data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempt();
  }, [attemptId, token]);

  const runEvaluation = async () => {
    try {
      setEvaluating(true);
      setError("");

      const res = await fetch(
        `${API}/api/interview/evaluate/${attemptId}`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to evaluate attempt");
      }

      setAttempt(data.attempt || data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-attempt-detail">
        <p>Loading attempt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-attempt-detail">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="admin-attempt-detail">
        <p>Attempt not found.</p>
      </div>
    );
  }

  const final = attempt.finalReport || {};
  const perQ = attempt.evaluation?.perQuestion || [];
  const scoreText =
    final.totalScore != null && final.maxScore
      ? `${final.totalScore} / ${final.maxScore} (${(
          (final.totalScore / final.maxScore) *
          100
        ).toFixed(1)}%)`
      : "Not evaluated";

  return (
    <div className="admin-attempt-detail">
      <div className="admin-report-card">
        <div className="admin-report-header">
          <h2>Interview Report</h2>
          <span className={`status-pill status-${attempt.status}`}>
            {attempt.status}
          </span>
        </div>

        <div className="admin-report-grid">
          <div className="admin-report-col">
            <div><strong>Candidate:</strong> {attempt.candidate?.name}</div>
            <div><strong>Email:</strong> {attempt.candidate?.email}</div>
            <div><strong>Job:</strong> {attempt.job?.title}</div>
            <div>
              <strong>Date:</strong>{" "}
              {attempt.createdAt
                ? new Date(attempt.createdAt).toLocaleString()
                : "—"}
            </div>
          </div>

          <div className="admin-report-col">
            <div><strong>Total Score:</strong> {scoreText}</div>
            <div>
              <strong>Integrity Score:</strong>{" "}
              {final.integrityScore != null
                ? `${(final.integrityScore * 100).toFixed(1)}%`
                : "N/A"}
            </div>
            <div>
              <strong>Verdict:</strong>{" "}
              {final.verdict ? final.verdict.toUpperCase() : "Not evaluated"}
            </div>
          </div>
        </div>

        <div className="admin-report-summary">
          <strong>Summary</strong>
          <p>{final.summary || "Run AI evaluation to generate a summary."}</p>
        </div>

        <div className="admin-report-actions">
          <button
            className="nav-btn submit"
            onClick={runEvaluation}
            disabled={evaluating}
          >
            {evaluating ? "Evaluating..." : "Run AI Evaluation"}
          </button>
        </div>
      </div>

      <div className="perq-section">
        <h3>Per-question breakdown</h3>
        {perQ.length === 0 ? (
          <p>No evaluation yet.</p>
        ) : (
          <div className="perq-list">
            {perQ.map((q) => {
              const ansObj = attempt.answers?.[q.questionIndex] || {};
              return (
                <div key={q.questionIndex} className="perq-card">
                  <div className="perq-header-line">
                    <span>
                      Question {q.questionIndex + 1} – Score {q.score}/10
                    </span>
                  </div>
                  <div className="perq-body">
                    <p className="perq-question">
                      <strong>Question:</strong> {ansObj.questionText}
                    </p>
                    <p className="perq-answer">
                      <strong>Answer:</strong>{" "}
                      {ansObj.answerText || ansObj.codeAnswer || "(no answer)"}
                    </p>
                    <p>
                      <strong>Strengths:</strong> {q.strengths || "—"}
                    </p>
                    <p>
                      <strong>Weaknesses:</strong> {q.weaknesses || "—"}
                    </p>
                    <p>
                      <strong>Feedback:</strong> {q.feedback || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
