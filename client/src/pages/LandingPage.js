import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./LandingPage.css";
import TeamSection from "../components/TeamSection";

export default function LandingPage() {
  const { hash } = useLocation();

  // enable "/#features" smooth scroll
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">AI Proctoring • Integrity Scoring • Ollama (llama3)</div>

          <h1 className="lp-title">
            Fast, fair hiring —
            <span className="lp-title-accent"> with live proctoring + AI evaluation</span>
          </h1>

          <p className="lp-subtitle">
            Generate questions, conduct monitored interviews, auto-evaluate answers, and review integrity reports —
            all in one system.
          </p>

          <div className="lp-cta">
            <Link to="/register" className="lp-btn lp-btn-primary">Get Started</Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">Login</Link>
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-num">Live</div>
              <div className="lp-stat-label">Proctoring</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">AI</div>
              <div className="lp-stat-label">Question Gen + Scoring</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">Role</div>
              <div className="lp-stat-label">Admin / Candidate</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="lp-section">
        <div className="lp-section-head">
          <h2>Features</h2>
          <p>Static landing content + your real dashboards after login.</p>
        </div>

        <div className="lp-grid">
          <div className="lp-card">
            <h3>Question Generation</h3>
            <p>Generate job-specific questions via Ollama (llama3) by title + difficulty + count.</p>
          </div>
          <div className="lp-card">
            <h3>Live Proctoring</h3>
            <p>Face presence, looking away, multiple faces, suspicious objects (mobile/book/paper).</p>
          </div>
          <div className="lp-card">
            <h3>Integrity Score</h3>
            <p>Real-time integrity score stored to Mongo via heartbeat (no video saving).</p>
          </div>
          <div className="lp-card">
            <h3>AI Evaluation</h3>
            <p>Per-question feedback + overall verdict and summary (llama3).</p>
          </div>
          <div className="lp-card">
            <h3>Admin Reports</h3>
            <p>View attempts, proctoring events, integrity %, and evaluation breakdown.</p>
          </div>
          <div className="lp-card">
            <h3>Candidate Flow</h3>
            <p>Jobs → Interview → Submit → Thank you page + attempt tracking.</p>
          </div>
        </div>
      </section>

      <section id="how" className="lp-section">
        <div className="lp-section-head">
          <h2>How it works</h2>
          <p>Simple workflow for both roles.</p>
        </div>

        <div className="lp-steps">
          <div className="lp-step"><span>1</span> Admin creates job + generates questions</div>
          <div className="lp-step"><span>2</span> Candidate selects job + starts interview</div>
          <div className="lp-step"><span>3</span> Live proctoring sends heartbeat to server</div>
          <div className="lp-step"><span>4</span> Candidate submits answers</div>
          <div className="lp-step"><span>5</span> Admin runs AI evaluation + reviews report</div>
        </div>
      </section>

      
       {/* ...hero + features... */}
      <TeamSection />
    </div>
  );
}
