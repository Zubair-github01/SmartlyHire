// client/src/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Auth.css"; // ✅ new shared auth styles

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await loginUser(email, password);

    if (!success) {
      setError("Invalid email or password");
      return;
    }

    // after login you can send to "/" or directly to role dashboard
    navigate("/");
    // or:
    // navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">
            Login to continue your Smartly Hire interview journey.
          </p>

          <form onSubmit={handleLogin}>
            {error && <p className="auth-error">{error}</p>}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="auth-actions">
              <button type="submit" className="auth-btn auth-btn-primary">
                Login
              </button>
            </div>
          </form>

          <p className="auth-hint">
            New here?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
