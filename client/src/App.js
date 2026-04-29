// App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import CreateJob from "./CreateJob";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./AuthContext";
import InterviewPage from "./InterviewPage";
import JobList from "./JobList";
import InterviewResultPage from "./InterviewResultPage";
import AdminAttemptsPage from "./AdminAttemptsPage";
import AdminAttemptDetail from "./AdminAttemptDetail";
import CandidateDashboard from "./CandidateDashboard";
import CandidateAttemptDetail from "./CandidateAttemptDetail";
import InterviewThankYou from "./InterviewThankYou";
import LandingPage from "./pages/LandingPage";
import Footer from "./components/Footer";

import "./App.css";

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Navbar />

      <div style={{ padding: "20px 10px" }}>
        <Routes>
          {/* ✅ Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ Role redirect */}
          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === "admin" ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to="/candidate" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* ------------ Candidate Area ------------ */}
          <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
            <Route path="/candidate" element={<CandidateDashboard />} />
            <Route path="/candidate/attempt/:id" element={<CandidateAttemptDetail />} />
            <Route path="/candidate/jobs" element={<JobList />} />
            <Route path="/candidate/interview/:jobId" element={<InterviewPage />} />

            {/* ✅ Pick ONE thank-you page (keep both if you want, but use different paths) */}
            <Route path="/candidate/interview/thank-you" element={<InterviewThankYou />} />
            {/* If you also want this page, change the URL so it isn’t duplicate */}
            <Route path="/candidate/interview/result" element={<InterviewResultPage />} />
          </Route>

          {/* ------------ Admin Area ------------ */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/create-job" element={<CreateJob />} />
            <Route path="/admin/attempts" element={<AdminAttemptsPage />} />
            <Route path="/admin/attempt/:attemptId" element={<AdminAttemptDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* Decorative bubbles */}
      <div className="bubble-container">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="bubble"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      {/* your <Navbar /> and <Routes /> */}
  <Footer />
    </div>
  );
}

export default App;
