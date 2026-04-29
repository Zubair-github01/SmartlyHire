import React from "react";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">
            <span className="footer-logo">🤖</span>
            <div>
              <div className="footer-title">Smartly Hire</div>
              <div className="footer-sub">
                Secure hiring • Live proctoring • AI evaluation
              </div>
            </div>
          </div>

          <div className="footer-copy">© {year} Smartly Hire. All rights reserved.</div>
        </div>

        <div className="footer-links">
          <a href="/" className="footer-link">Home</a>
          <a href="/login" className="footer-link">Login</a>
          <a href="/register" className="footer-link">Sign up</a>
        </div>
      </div>
    </footer>
  );
}
