import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function RoleRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) return navigate("/login");

    if (user.role === "admin") return navigate("/admin");
    if (user.role === "candidate") return navigate("/candidate/jobs");

    // fallback
    navigate("/login");
  }, [user, loading, navigate]);

  return (
    <div style={{ padding: 24, color: "white" }}>
      Redirecting...
    </div>
  );
}
