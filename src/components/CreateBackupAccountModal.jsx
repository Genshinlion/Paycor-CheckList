import { useState } from "react";

export default function CreateBackupAccountModal({ onClose }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [role,    setRole]    = useState("employee");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !phone) { setError("All fields are required."); return; }
    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/.netlify/functions/create-backup-account", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create account."); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Create backup account</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-note">
              &#128274; A secure temp password will be generated and texted to the employee.
              They must set a new password on first login.
            </div>

            <div className="field" style={{ marginBottom: "12px" }}>
              <label>Full name</label>
              <input type="text" placeholder="e.g. Jane Smith"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field" style={{ marginBottom: "12px" }}>
              <label>Work email</label>
              <input type="email" placeholder="jane@company.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="field-row" style={{ marginBottom: "16px" }}>
              <div className="field">
                <label>Mobile phone</label>
                <input type="tel" placeholder="+1 (555) 000-0000"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            {error && <div className="login-error" style={{ marginBottom: "12px" }}>{error}</div>}

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button className="modal-btn confirm" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating…" : "Create & send SMS"}
              </button>
            </div>
          </>
        ) : (
          <div className="modal-success">
            <div className="modal-success-icon">&#128274;</div>
            <h3>Account created!</h3>
            <p>A temporary password has been texted to {name.split(" ")[0]}.
               They'll be prompted to set a new one on first login.</p>
            <button className="modal-btn confirm" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
