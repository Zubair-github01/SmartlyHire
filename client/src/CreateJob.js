import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import AdminLayout from "./AdminLayout";
import "./CreateJob.css";

function CreateJob() {
  const { token } = useAuth();

  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [number, setNumber] = useState(5);
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([]);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_BASE =
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL ||
    "https://smartly-hire.vercel.app";

  const generateQuestions = async () => {
    setMessage("");
    setError("");

    if (!jobTitle) return setError("Please enter a job title first.");
    if (!number || Number(number) <= 0)
      return setError("Number of questions must be at least 1.");

    setLoadingQuestions(true);

    try {
      const res = await fetch(`${API_BASE}/api/interview/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          difficulty,
          numberOfQuestions: Number(number),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Backend error generating questions");

      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setMessage("Questions generated. Review them and click Save Job.");
    } catch (err) {
      setError(err.message || "Failed to generate questions. Make sure backend is running.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const saveJob = async () => {
    setError("");
    setMessage("");

    if (!jobTitle || !description || !deadline)
      return setError("Please fill Title, Description and Deadline.");

    if (!questions.length) return setError("Generate questions before saving.");

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          title: jobTitle,
          description,
          requirements,
          numberOfQuestions: Number(number),
          applicationDeadline: deadline,
          difficulty,
          questions,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to save job");

      setMessage("✅ Job saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="create-job-page">
        <h2 className="cj-title">Create New Job</h2>

        <div className="cj-card">
          <input
            className="cj-input"
            placeholder="Job Title (e.g. Frontend Developer)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />

          <textarea
            className="cj-input cj-textarea"
            placeholder="Short job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <textarea
            className="cj-input cj-textarea"
            placeholder="Requirements (optional)"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />

          <div className="cj-row">
            <select
              className="cj-input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <input
              className="cj-input"
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />

            <input
              className="cj-input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="cj-row-buttons">
            <button
              className="cj-btn primary"
              onClick={generateQuestions}
              disabled={loadingQuestions}
            >
              {loadingQuestions ? "Generating..." : "Generate Questions"}
            </button>

            <button
              className="cj-btn success"
              onClick={saveJob}
              disabled={saving || !questions.length}
            >
              {saving ? "Saving..." : "Save Job"}
            </button>
          </div>

          {error && <p className="cj-error">{error}</p>}
          {message && <p className="cj-success">{message}</p>}
        </div>

        {questions?.length > 0 && (
          <div className="cq-wrap">
            <h3 className="cq-title">Generated Questions</h3>

            <div className="cq-list">
              {questions.map((q, idx) => (
                <div key={idx} className="cq-card">
                  <div className="cq-top">
                    <div className="cq-badge">
                      {q.type === "coding" ? "Coding" : q.type === "mcq" ? "MCQ" : "Text"} • #{idx + 1}
                    </div>
                  </div>

                  <div className="cq-question">{q.question}</div>

                  {q.type === "mcq" && Array.isArray(q.options) && q.options.length > 0 && (
                    <ul className="cq-options">
                      {q.options.map((op, i) => (
                        <li key={i} className="cq-option">{op}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default CreateJob;
