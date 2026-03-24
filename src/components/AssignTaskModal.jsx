import { useState } from "react";
import { useApp } from "../store/AppContext";

const CATEGORIES = ["Operations", "Stocking", "Facilities", "Customer"];

export default function AssignTaskModal({ onClose }) {
  const { nonManagers, addTask } = useApp();
  const [title,      setTitle]      = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [category,   setCategory]   = useState("Operations");
  const [done,       setDone]       = useState(false);
  const [sending,    setSending]    = useState(false);

  const canSubmit = title.trim() && assignedTo;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);

    const task = { title, assignedTo, category, recurring: true };
    addTask(task);

    const emp = nonManagers.find(e => e.id === assignedTo);

    // Notify employee via SMS
    try {
      await fetch("/.netlify/functions/notify-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, employee: emp }),
      });
    } catch (e) {
      console.warn("SMS notify failed:", e);
    }

    setSending(false);
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Assign New Task</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="field" style={{ marginBottom: "14px" }}>
              <label>Task Title</label>
              <input
                type="text"
                placeholder="e.g. Restock paper towels in zone B"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="field-row" style={{ marginBottom: "14px" }}>
              <div className="field">
                <label>Assign To</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                  <option value="">— Select employee —</option>
                  {nonManagers.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-note">
              📱 Employee will receive an SMS notification when assigned.
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button
                className={`modal-btn confirm ${!canSubmit ? "disabled" : ""}`}
                onClick={handleSubmit}
                disabled={!canSubmit || sending}
              >
                {sending ? "Assigning…" : "Assign Task"}
              </button>
            </div>
          </>
        ) : (
          <div className="modal-success">
            <div className="modal-success-icon">📋</div>
            <h3>Task assigned!</h3>
            <p>The employee has been notified via SMS.</p>
            <button className="modal-btn confirm" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
