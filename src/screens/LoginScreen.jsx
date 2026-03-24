import { useState } from "react";
import { useApp } from "../store/AppContext";

export default function LoginScreen() {
  const { employees, setCurrentUser } = useApp();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handlePaycorLogin = () => {
    // Production: window.location.href = "/.netlify/functions/auth-start"
    // Dev: falls through to profile picker below
    if (!import.meta.env.DEV) {
      window.location.href = "/.netlify/functions/auth-start";
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      if (data.mustChangePassword) window.location.href = "/change-password";
      else window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="login-wrap">
      <div className="login-box">

        <div className="login-brand">
          <span className="nav-dot large" />
          ShiftCheck
        </div>
        <p className="login-sub">Pre clock-out task management</p>

        {/* Paycor SSO */}
        <button className="paycor-sso-btn" onClick={handlePaycorLogin}>
          <span className="paycor-logo-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect width="16" height="16" rx="3" fill="#C5382D"/>
              <text x="8" y="12" textAnchor="middle" fontSize="10"
                fontWeight="700" fill="#fff" fontFamily="sans-serif">P</text>
            </svg>
          </span>
          Sign in with Paycor
        </button>

        <div className="login-divider"><span>or backup login</span></div>

        {/* Local backup form */}
        <form className="login-form" onSubmit={handleLocalLogin}>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in with backup account"}
          </button>
        </form>

        <p className="login-note">
          Backup accounts are created by your manager. Paycor sign-in is
          recommended — your credentials stay on Paycor's servers.
        </p>

        {/* Dev-only profile picker */}
        {isDev && (
          <div className="dev-picker">
            <div className="dev-picker-label">&#9888; DEV ONLY — quick profile picker</div>
            <ul className="profile-list">
              {employees.map(emp => (
                <li key={emp.id}>
                  <button className={`profile-btn ${emp.role === "manager" ? "mgr" : ""}`}
                    onClick={() => setCurrentUser(emp)}>
                    <span className="profile-avatar">{emp.name[0]}</span>
                    <div className="profile-info">
                      <span className="profile-name">{emp.name}</span>
                      <span className="profile-meta">{emp.role}</span>
                    </div>
                    <span className="profile-arrow">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
