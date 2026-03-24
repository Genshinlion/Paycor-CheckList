import { useState } from "react";
import { useApp } from "../store/AppContext";

export default function SwapModal({ task, onClose }) {
  const { currentUser, nonManagers, requestSwap } = useApp();
  const [toId,   setToId]   = useState("");
  const [reason, setReason] = useState("");
  const [done,   setDone]   = useState(false);
  const [sending, setSending] = useState(false);

  const coworkers = nonManagers.filter(e => e.id !== currentUser.id);

  const handleSubmit = async () => {
    if (!toId) return;
    setSending(true);

    const swap = requestSwap(task.id, currentUser.id, toId, reason);

    // Notify both employees + manager via Netlify function
    try {
      await fetch("/.netlify/functions/notify-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swap, task, currentUser }),
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
              <h2 className="modal-title">Request Task Swap</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-task-preview">
              <span className="modal-task-label">Task</span>
              <span className="modal-task-name">{task.title}</span>
            </div>

            <div className="field" style={{ marginBottom: "14px" }}>
              <label>Swap with</label>
              <select value={toId} onChange={e => setToId(e.target.value)}>
                <option value="">— Select a coworker —</option>
                {coworkers.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: "20px" }}>
              <label>Reason (optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. I'm covering the front desk today..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="modal-note">
              ⚡ Swaps are auto-approved. Your manager will be notified via SMS.
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button
                className={`modal-btn confirm ${!toId ? "disabled" : ""}`}
                onClick={handleSubmit}
                disabled={!toId || sending}
              >
                {sending ? "Sending…" : "Confirm Swap"}
              </button>
            </div>
          </>
        ) : (
          <div className="modal-success">
            <div className="modal-success-icon">🔄</div>
            <h3>Swap complete!</h3>
            <p>The task has been reassigned and both parties notified by SMS.</p>
            <button className="modal-btn confirm" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
