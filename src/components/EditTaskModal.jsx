import { useState } from "react";
import { useApp } from "../store/AppContext";

const CATEGORIES = ["Operations", "Stocking", "Facilities", "Customer"];

export default function EditTaskModal({ task, onClose }) {
  const { nonManagers, updateTask } = useApp();
  const [title,      setTitle]      = useState(task.title);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [category,   setCategory]   = useState(task.category);

  const handleSave = () => {
    updateTask(task.id, { title, assignedTo, category });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="field" style={{ marginBottom: "14px" }}>
          <label>Task Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="field-row" style={{ marginBottom: "20px" }}>
          <div className="field">
            <label>Assigned To</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
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

        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn confirm" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
