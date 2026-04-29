// client/src/InterviewResultPage.js
import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function InterviewResultPage() {
  const location = useLocation();
  const attemptId = location.state?.attemptId;

  return (
    <div className="interview-page">
      <h1>Thank you for completing the interview!</h1>
      <p>Your answers have been submitted successfully.</p>

      {attemptId && (
        <p>
          Your attempt ID: <code>{attemptId}</code>
        </p>
      )}

      <p>
        Once the recruiter runs AI evaluation, your interview will be reviewed.
      </p>

      <Link to="/candidate/jobs" className="nav-btn primary">
        Back to Job List
      </Link>
    </div>
  );
}
