import { useState } from "react";
import { useApp } from "../store/AppContext";
import AssignTaskModal from "../components/AssignTaskModal";
import EditTaskModal   from "../components/EditTaskModal";
import CreateBackupAccountModal from "../components/CreateBackupAccountModal";

const TABS = ["Team Overview", "All Tasks", "Swap Log"];

export default function ManagerHome() {
  const [tab,         setTab]         = useState(0);
  const [showAssign,  setShowAssign]  = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [showBackup,  setShowBackup]  = useState(false);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="shift-badge manager">MANAGER PANEL</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
          <h1 className="screen-title" style={{ marginBottom:0 }}>Task Control</h1>
          <button className="backup-account-btn" onClick={() => setShowBackup(true)}>
            + Create backup account
          </button>
        </div>
        <p className="screen-sub">Assign, manage, and monitor all employee shift tasks</p>
      </div>

      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`tab-btn ${tab === i ? "active" : ""}`}
            onClick={() => setTab(i)}
          >{t}</button>
        ))}
        <button className="tab-action-btn" onClick={() => setShowAssign(true)}>
          + Assign Task
        </button>
      </div>

      {tab === 0 && <TeamOverview onEditTask={setEditTask} />}
      {tab === 1 && <AllTasks    onEditTask={setEditTask} />}
      {tab === 2 && <SwapLog />}

      {showAssign  && <AssignTaskModal onClose={() => setShowAssign(false)} />}
      {editTask    && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}
      {showBackup  && <CreateBackupAccountModal onClose={() => setShowBackup(false)} />}
    </div>
  );
}

// ── Team Overview ─────────────────────────────────────────────────────────────
function TeamOverview({ onEditTask }) {
  const { nonManagers, tasksFor, isCompleted } = useApp();

  return (
    <div className="team-grid">
      {nonManagers.map(emp => {
        const tasks   = tasksFor(emp.id);
        const done    = tasks.filter(t => isCompleted(t.id));
        const pct     = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
        const cleared = tasks.length > 0 && done.length === tasks.length;

        return (
          <div key={emp.id} className={`emp-card ${cleared ? "cleared" : ""}`}>
            <div className="emp-card-top">
              <div className={`emp-avatar-lg ${cleared ? "done" : ""}`}>
                {emp.name[0]}
              </div>
              <div>
                <div className="emp-card-name">{emp.name}</div>
                <div className="emp-card-meta">{tasks.length} tasks assigned</div>
              </div>
              {cleared && <span className="cleared-badge">✓ Clear</span>}
            </div>

            <div className="mini-progress">
              <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="mini-progress-label">{done.length}/{tasks.length} complete</div>

            <ul className="emp-task-mini">
              {tasks.map(t => (
                <li key={t.id} className={`emp-task-mini-row ${isCompleted(t.id) ? "done" : ""}`}>
                  <span className="mini-check">{isCompleted(t.id) ? "✓" : "○"}</span>
                  <span>{t.title}</span>
                  <button className="mini-edit" onClick={() => onEditTask(t)}>edit</button>
                </li>
              ))}
              {tasks.length === 0 && (
                <li className="emp-task-mini-row muted">No tasks assigned</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ── All Tasks flat list ───────────────────────────────────────────────────────
function AllTasks({ onEditTask }) {
  const { tasks, getEmployee, isCompleted, deleteTask } = useApp();

  return (
    <div className="card">
      <table className="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Category</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const emp  = getEmployee(t.assignedTo);
            const done = isCompleted(t.id);
            return (
              <tr key={t.id} className={done ? "row-done" : ""}>
                <td className="td-title">{t.title}</td>
                <td><span className="cat-tag">{t.category}</span></td>
                <td>{emp?.name ?? "—"}</td>
                <td>
                  <span className={`status-dot ${done ? "done" : "pending"}`}>
                    {done ? "Done" : "Pending"}
                  </span>
                </td>
                <td className="td-actions">
                  <button className="tbl-btn edit"   onClick={() => onEditTask(t)}>Edit</button>
                  <button className="tbl-btn delete" onClick={() => deleteTask(t.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Swap Log ──────────────────────────────────────────────────────────────────
function SwapLog() {
  const { swaps, getEmployee, getTask } = useApp();

  if (swaps.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔄</div>
        <p>No task swaps have been made yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-label">All Swap Requests</h2>
      <ul className="swap-full-list">
        {swaps.map(swap => {
          const from = getEmployee(swap.fromId);
          const to   = getEmployee(swap.toId);
          const task = getTask(swap.taskId);
          const time = new Date(swap.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
          return (
            <li key={swap.id} className="swap-full-row">
              <div className="swap-full-top">
                <span className={`swap-badge ${swap.status}`}>{swap.status}</span>
                <span className="swap-time">{time}</span>
              </div>
              <div className="swap-full-body">
                <strong>{from?.name}</strong> → <strong>{to?.name}</strong>
                <span className="swap-task-name">"{task?.title}"</span>
              </div>
              {swap.reason && (
                <div className="swap-reason">Reason: {swap.reason}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
