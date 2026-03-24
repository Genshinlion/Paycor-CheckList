import { useState } from "react";
import { useApp } from "../store/AppContext";

export default function TaskCompletionModal({ task, onClose }) {
  const { currentUser, completeTask } = useApp();
  const [notes, setNotes] = useState("");
  const [done,  setDone]  = useState(false);

  const handleSubmit = () => {
    completeTask(task.id, currentUser.id, notes);
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Mark Task Complete</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-task-preview">
              <span className="modal-task-label">Task</span>
              <span className="modal-task-name">{task.title}</span>
            </div>

            <div className="field" style={{ marginBottom: "20px" }}>
              <label>Completion Notes (optional)</label>
              <textarea
                rows={4}
                placeholder="Any notes for the next shift or manager…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button className="modal-btn confirm" onClick={handleSubmit}>
                ✓ Mark Complete
              </button>
            </div>
          </>
        ) : (
          <div className="modal-success">
            <div className="modal-success-icon">✅</div>
            <h3>Task marked complete!</h3>
            <p>Great work. Keep going — your shift is almost done.</p>
            <button className="modal-btn confirm" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
