// src/Navbar.js
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "./AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Decide where "Home" and "Jobs" should go based on role
  const homePath = user ? "/dashboard" : "/";


  const jobsPath = !user
    ? "/login"
    : user.role === "admin"
    ? "/admin/create-job" // admin manages jobs
    : "/candidate/jobs"; // candidate job list

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="nav-wrapper">
      <nav className="navbar">
        {/* Brand / Logo */}
        <div className="nav-left">
          <Link to={homePath} className="nav-logo">
            <span className="nav-logo-icon">🤖</span>
            <span className="nav-logo-text">Smartly Hire</span>
          </Link>
        </div>

        {/* Center links */}
        <div className="nav-center">
          {/* Home (role-aware) */}
          <NavLink
            to={homePath}
            end
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link-active" : "")
            }
          >
            Home
          </NavLink>

          {/* Jobs (role-aware) */}
          <NavLink
            to={jobsPath}
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link-active" : "")
            }
          >
            Jobs
          </NavLink>

          {/* Candidate link – only for candidate users */}
          {user && user.role === "candidate" && (
            <NavLink
              to="/candidate"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " nav-link-active" : "")
              }
            >
              Candidate
            </NavLink>
          )}

          {/* Admin link – only for admin users */}
          {user && user.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " nav-link-active" : "")
              }
            >
              Admin
            </NavLink>
          )}
        </div>

        {/* Right side actions */}
        <div className="nav-right">
          {!user ? (
            <>
              <Link to="/login" className="nav-btn nav-btn-ghost">
                Login
              </Link>
              <Link to="/register" className="nav-btn nav-btn-primary">
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="nav-btn nav-btn-primary"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
