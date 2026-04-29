import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JobList.css";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || "https://smartly-hire.vercel.app";

  useEffect(() => {
  fetch(`${API}/api/jobs`)
    .then((res) => res.json())
    .then((data) => {
      // backend returns { success, jobs: [...] }
      setJobs(Array.isArray(data.jobs) ? data.jobs : data);
    })
    .catch((e) => console.error("Error loading jobs:", e));
}, []);


  const startInterview = (jobId) => {
    navigate(`/candidate/interview/${jobId}`);
  };

  return (
    <div className="joblist-page">
      <div className="joblist-shell">
        <div className="joblist-header">
          <h1 className="job-title">Available Jobs</h1>
          <p className="job-subtitle">
            Pick a role and start your proctored interview.
          </p>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 && <p className="no-jobs">No jobs found yet.</p>}

          {jobs.map((job) => (
            <div key={job._id} className="job-card">
              <h2 className="job-card-title">{job.title}</h2>
              <p className="job-desc">{job.description}</p>

              <div className="job-info">
                <span>
                  Difficulty: <strong>{job.difficulty}</strong>
                </span>
                <span>
                  Questions: <strong>{job.numberOfQuestions}</strong>
                </span>
                <span>
                  Deadline:{" "}
                  <strong>{job.applicationDeadline?.slice(0, 10)}</strong>
                </span>
              </div>

              <button className="apply-btn" onClick={() => startInterview(job._id)}>
                Start Interview →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
