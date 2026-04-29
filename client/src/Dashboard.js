import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "./AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    evaluatedAttempts: 0,
    jobs: 0,
  });
  const [topScorers, setTopScorers] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);


  const { token, user } = useAuth();

  const API_BASE =
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (!res.ok) return;
      const data = await res.json();
      setReports(Array.isArray(data) ? data.slice().reverse() : []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const attemptsRes = await fetch(`${API_BASE}/api/interview/attempts`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      let totalAttempts = 0;
      let evaluatedAttempts = 0;
      if (attemptsRes.ok) {
        const data = await attemptsRes.json();
        const list = data.attempts || data;
        if (Array.isArray(list)) {
          totalAttempts = list.length;
          evaluatedAttempts = list.filter((a) => a.status === "evaluated").length;
        }
      }

      // 🔐 Only count jobs created by this admin
      const jobsRes = await fetch(`${API_BASE}/api/jobs/my`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      let jobs = 0;
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const list = data.jobs || data;
        if (Array.isArray(list)) jobs = list.length;
      }


      setStats({ totalAttempts, evaluatedAttempts, jobs });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };
  const fetchTopScorers = async () => {
  try {
    setLoadingTop(true);

    const res = await fetch(`${API_BASE}/api/interview/top-scorers?limit=5`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    if (!res.ok) {
      setTopScorers([]);
      return;
    }

    const data = await res.json();
    setTopScorers(Array.isArray(data.top) ? data.top : []);
  } catch (err) {
    console.error("Error fetching top scorers:", err);
    setTopScorers([]);
  } finally {
    setLoadingTop(false);
  }
};


  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!token) return;

    fetchStats();
    fetchTopScorers();

    const interval = setInterval(() => {
      fetchReports();
      fetchTopScorers();
      fetchStats(); // ✅ keep stats fresh too
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);


  return (
    <AdminLayout>
      <div className="dashboard-page">
        <h1 className="dash-title">Admin Overview</h1>
        <p className="dash-subtitle">
          {user ? `Welcome, ${user.name}. ` : "Welcome. "}
          Here’s a quick snapshot of your interviews and jobs.
        </p>

        <div className="dash-metrics-row">
          <div className="dash-metric-card">
            <div className="dash-metric-label">Total Interview Attempts</div>
            <div className="dash-metric-value">{stats.totalAttempts}</div>
            <div className="dash-metric-foot">All candidates</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-label">Evaluated Attempts</div>
            <div className="dash-metric-value">{stats.evaluatedAttempts}</div>
            <div className="dash-metric-foot">AI scoring completed</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-label">Active Jobs</div>
            <div className="dash-metric-value">{stats.jobs}</div>
            <div className="dash-metric-foot">Open interview positions</div>
          </div>
        </div>

        <h2 className="dash-section-title">Top Scorers (Active Hirings)</h2>

        {loadingTop ? (
          <p className="dash-empty">Loading leaderboard…</p>
        ) : topScorers.length === 0 ? (
          <p className="dash-empty">No evaluated attempts found yet.</p>
        ) : (
          <div className="leader-grid">
            {topScorers.map((s, idx) => (
              <div key={s.attemptId || idx} className="leader-card">
                <div className="leader-rank">#{idx + 1}</div>

                <div className="leader-main">
                  <div className="leader-name">{s?.candidate?.name || "Candidate"}</div>
                  <div className="leader-sub">{s?.job?.title || "Job"} • Verdict: {s.verdict || "—"}</div>

                  <div className="leader-bars">
                    <div className="bar-row">
                      <span>AI</span>
                      <div className="bar"><div className="bar-fill" style={{ width: `${s.aiPct || 0}%` }} /></div>
                      <b>{s.aiPct || 0}%</b>
                    </div>

                    <div className="bar-row">
                      <span>Integrity</span>
                      <div className="bar"><div className="bar-fill" style={{ width: `${s.integrityPct || 0}%` }} /></div>
                      <b>{s.integrityPct || 0}%</b>
                    </div>

                    <div className="bar-row">
                      <span>Total</span>
                      <div className="bar"><div className="bar-fill" style={{ width: `${s.composite || 0}%` }} /></div>
                      <b>{s.composite || 0}%</b>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
