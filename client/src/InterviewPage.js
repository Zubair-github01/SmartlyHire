// client/src/InterviewPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Proctor from "./proctor";
import "./InterviewPage.css";

const API = process.env.REACT_APP_API_URL || "https://smartly-hire.vercel.app";
const QUESTION_TIME = 5 * 60; // 5 minutes in seconds

export default function InterviewPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // start + timer
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  // ✅ candidate name (controls Start Interview)
  const [candidateName, setCandidateName] = useState("");
    // ✅ TTS (Voice for questions)
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsSupported] = useState(() => "speechSynthesis" in window);

  const stopTTS = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  };

  const speak = (text) => {
    if (!ttsEnabled) return;
    if (!("speechSynthesis" in window)) return;
    if (!text) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  };


  // Load job + questions
  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API}/api/jobs/${jobId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load job");

        const jobData = data.job || data;
        const qs = jobData.questions || [];

        setJob(jobData);
        setQuestions(qs);

        setAnswers(
          qs.map((q) => ({
            questionText: q.question || "",
            type: q.type || "text",
            answerText: "",
            codeAnswer: "",
          }))
        );
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
    // ✅ Speak current question when interview starts or question changes
  useEffect(() => {
    if (!hasStarted) return;
    if (!currentQuestion?.question) return;

    speak(currentQuestion.question);

    return () => stopTTS();
  }, [hasStarted, currentIndex]);


  // Reset timer whenever question changes or when interview starts
  useEffect(() => {
    if (!hasStarted) return;
    setTimeLeft(QUESTION_TIME);
  }, [currentIndex, hasStarted]);

  // Timer countdown logic
  useEffect(() => {
    if (!hasStarted) return;
    if (!questions.length) return;
    

    if (timeLeft <= 0) {
      if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      else handleSubmit();
      return;
    }

    const timerId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, hasStarted, currentIndex, questions.length]);

  const handleAnswerChange = (value) => {
    setAnswers((prev) => {
      const copy = [...prev];
      const a = { ...copy[currentIndex] };
      const type = currentQuestion?.type || a.type;

      if (type === "coding") a.codeAnswer = value;
      else a.answerText = value;

      copy[currentIndex] = a;
      return copy;
    });
  };

  const goNext = () => {
    stopTTS();
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    stopTTS();
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      stopTTS();

      

      const res = await fetch(`${API}/api/interview/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ jobId, answers, attemptId,}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit interview");

      navigate("/candidate/interview/thank-you", {
        state: { attemptId: data.attempt?._id },
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="interview-page">
        <div className="ip-center">
          <div className="ip-loader-card">
            <div className="ip-spinner" />
            <div className="ip-loader-title">Loading interview…</div>
            <div className="ip-loader-sub">Preparing questions & setup</div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="interview-page">
        <div className="ip-center">
          <div className="ip-alert-card">
            <div className="ip-alert-title">Something went wrong</div>
            <div className="ip-alert-text">{error}</div>
            <button className="nav-btn primary" onClick={() => navigate("/candidate/jobs")}>
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );

  if (!job || questions.length === 0)
    return (
      <div className="interview-page">
        <div className="ip-center">
          <div className="ip-alert-card">
            <div className="ip-alert-title">No questions found</div>
            <div className="ip-alert-text">This job doesn’t have questions yet.</div>
            <button className="nav-btn primary" onClick={() => navigate("/candidate/jobs")}>
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );

  const isLast = currentIndex === questions.length - 1;
  const type = currentQuestion?.type || "text";
  const value = type === "coding" ? currentAnswer?.codeAnswer || "" : currentAnswer?.answerText || "";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="interview-page">
      <div className="interview-shell">
        <div className="interview-layout">
          {/* LEFT */}
          <aside className="interview-proctor-panel">
            <div className="ip-card">
              <div className="ip-card-head">
                <div className="ip-card-title">Proctor Panel</div>
                <div className="ip-card-subtitle">Camera + integrity tracking</div>
              </div>

              <div className={`ip-proctor-wrap ${hasStarted ? "live" : ""}`}>
                {/* ✅ no input/buttons inside proctor in interview mode */}
                <Proctor autoStart={hasStarted} attemptId={attemptId} candidateName={candidateName} hideControls />
              </div>

              <div className={`ip-help ${hasStarted ? "live" : ""}`}>
                {!hasStarted ? (
                  <>
                    <div className="ip-help-badge">Before you start</div>
                    <ul className="ip-help-list">
                      <li>Enter your name</li>
                      <li>Allow camera permission</li>
                      <li>Click <b>Start Interview</b> on the right</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="ip-help-badge live">Live</div>
                    <div className="ip-help-text">
                      Stay focused. Suspicious activity is logged and affects integrity score.
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT */}
          <section className="interview-qa-panel">
            {!hasStarted ? (
              <div className="interview-start-screen">
                <div className="ip-hero">
                  <div className="ip-hero-title">{job.title}</div>
                  <div className="ip-hero-sub">{job.description}</div>
                </div>

                <div className="ip-start-card">
                  <div className="ip-start-row">
                    <label className="ip-label">Candidate name</label>
                    <input
                      className="ip-name-input"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter your full name…"
                      autoComplete="name"
                    />
                  </div>

                  <div className="ip-start-actions">
                    <button
                      className="nav-btn primary"
                      onClick={() => navigate("/candidate/jobs")}
                      disabled={submitting}
                    >
                      ← Back
                    </button>

                    <button
                      className="nav-btn submit"
                      onClick={async () => {
                        try {
                          setError("");
                          const res = await fetch(`${API}/api/interview/start`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: token ? `Bearer ${token}` : "",
                            },
                            body: JSON.stringify({ jobId }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message || "Failed to start attempt");

                          setAttemptId(data.attemptId);
                          setHasStarted(true);
                        } catch (e) {
                          setError(e.message);
                        }
                      }}

                      
                      disabled={!candidateName.trim() || submitting}
                      title={!candidateName.trim() ? "Enter your name first" : ""}
                    >
                      Start Interview ✦
                    </button>
                  </div>

                  <div className="ip-start-hint">
                    Tip: keep your face visible and avoid phones/books during the session.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="interview-header">
                  <div>
                    <h1 className="ip-h1">{job.title}</h1>
                    <p className="ip-p">{job.description}</p>
                  </div>

                  <div className="ip-timer-chip">
                    <span className="ip-timer-dot" />
                    <span className="ip-timer-text">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div className="question-card">
                  <div className="question-meta">
                    {ttsSupported && (
                      <span className="qm-pill soft" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: "6px 10px" }}
                          onClick={() => {
                            setTtsEnabled((v) => !v);
                            stopTTS();
                          }}
                        >
                          {ttsEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
                        </button>

                        <button
                          type="button"
                          className="nav-btn primary"
                          style={{ padding: "6px 10px" }}
                          onClick={() => speak(currentQuestion?.question || "")}
                        >
                          ↻ Repeat
                        </button>
                      </span>
                    )}

                    <span className="qm-pill">
                      Question {currentIndex + 1} / {questions.length}
                    </span>

                    <span className="qm-pill soft">
                      {type === "coding" ? "Coding" : "Text"}
                    </span>

                    <span className={`qm-pill ${timeLeft <= 30 ? "danger" : "ok"}`}>
                      Time left: {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="question-text">{currentQuestion.question}</h2>

                  <textarea
                    className={`answer-input ${type === "coding" ? "code" : ""}`}
                    rows={10}
                    value={value}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder={type === "coding" ? "Write your code here…" : "Type your answer here…"}
                  />
                </div>

                <div className="nav-buttons">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0 || submitting}
                    className="nav-btn"
                  >
                    ← Previous
                  </button>

                  {!isLast && (
                    <button onClick={goNext} disabled={submitting} className="nav-btn primary">
                      Next →
                    </button>
                  )}

                  {isLast && (
                    <button onClick={handleSubmit} disabled={submitting} className="nav-btn submit">
                      {submitting ? "Submitting…" : "Submit Interview"}
                    </button>
                  )}
                </div>

                {error && <p className="error small">{error}</p>}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
