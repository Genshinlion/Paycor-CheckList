import { useState } from "react";

export default function ChangePasswordScreen() {
  const [newPass,    setNewPass]    = useState("");
  const [confirm,   setConfirm]    = useState("");
  const [error,     setError]      = useState("");
  const [loading,   setLoading]    = useState(false);
  const [done,      setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPass !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");

    try {
      // userId comes from the session cookie — decoded server-side
      const res  = await fetch("/.netlify/functions/change-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update password."); return; }
      setDone(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-brand">
          <span className="nav-dot large" />
          ShiftCheck
        </div>

        {done ? (
          <div className="login-success">
            <div className="success-icon-lg">&#10003;</div>
            <p>Password updated! Redirecting…</p>
          </div>
        ) : (
          <>
            <p className="login-sub" style={{ marginBottom: "6px" }}>
              Set your new password
            </p>
            <p className="login-note" style={{ marginBottom: "20px" }}>
              Your manager created a temporary password for your account.
              Please set a permanent one before continuing.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>New password</label>
                <input type="password" placeholder="Min. 8 characters"
                  value={newPass} onChange={e => setNewPass(e.target.value)} autoComplete="new-password"/>
              </div>
              <div className="field">
                <label>Confirm password</label>
                <input type="password" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"/>
              </div>

              {/* Strength hints */}
              <ul className="pw-hints">
                <li className={newPass.length >= 8         ? "hint-ok" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPass)       ? "hint-ok" : ""}>One uppercase letter</li>
                <li className={/[0-9]/.test(newPass)       ? "hint-ok" : ""}>One number</li>
                <li className={newPass && newPass===confirm ? "hint-ok" : ""}>Passwords match</li>
              </ul>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Saving…" : "Set password & continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
