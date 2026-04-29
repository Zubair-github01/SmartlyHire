// client/src/AdminSidebar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="admin-sidebar">
      <h2 className="side-title">Admin Panel</h2>

      <Link
        className={`side-link ${path === "/admin" ? "active" : ""}`}
        to="/admin"
      >
        Dashboard
      </Link>

      <Link
        className={`side-link ${
          path === "/admin/create-job" ? "active" : ""
        }`}
        to="/admin/create-job"
      >
        Create Job
      </Link>

      <Link
        className={`side-link ${path === "/admin/jobs" ? "active" : ""}`}
        to="/admin/jobs"
      >
        Manage Jobs
      </Link>

      {/* Reports = AI interview attempts */}
      <Link
        className={`side-link ${
          path.startsWith("/admin/attempt") ? "active" : ""
        }`}
        to="/admin/attempts"
      >
        Reports
      </Link>
    </div>
  );
}
