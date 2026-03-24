import { useState } from "react";
import { useApp } from "../store/AppContext";
import SwapModal from "../components/SwapModal";
import TaskCompletionModal from "../components/TaskCompletionModal";

const CATEGORY_COLORS = {
  Operations: "amber",
  Stocking:   "blue",
  Facilities: "green",
  Customer:   "pink",
};

export default function EmployeeHome() {
  const { currentUser, tasksFor, isCompleted, swaps, getEmployee } = useApp();
  const myTasks = tasksFor(currentUser.id);
  const done    = myTasks.filter(t => isCompleted(t.id));
  const pending = myTasks.filter(t => !isCompleted(t.id));

  const [swapTarget,    setSwapTarget]    = useState(null); // task to swap
  const [completeTarget, setCompleteTarget] = useState(null); // task to mark done

  const mySwaps = swaps.filter(s => s.fromId === currentUser.id || s.toId === currentUser.id);

  const pct = myTasks.length
    ? Math.round((done.length / myTasks.length) * 100)
    : 0;

  return (
    <div className="screen">

      {/* Header */}
      <div className="screen-header">
        <div className="shift-badge">TODAY'S SHIFT</div>
        <h1 className="screen-title">Hey, {currentUser.name.split(" ")[0]} 👋</h1>
        <p className="screen-sub">
          {done.length} of {myTasks.length} tasks complete
          {pending.length === 0 && myTasks.length > 0 && " · ✓ Clear to clock out!"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-pct">{pct}%</span>
      </div>

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="card">
          <h2 className="section-label">Pending Tasks</h2>
          <ul className="task-list">
            {pending.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                status="pending"
                onComplete={() => setCompleteTarget(task)}
                onSwap={() => setSwapTarget(task)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <div className="card">
          <h2 className="section-label">Completed</h2>
          <ul className="task-list">
            {done.map(task => (
              <TaskRow key={task.id} task={task} status="done" />
            ))}
          </ul>
        </div>
      )}

      {myTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No tasks assigned yet. Your manager will assign tasks shortly.</p>
        </div>
      )}

      {/* Swap history */}
      {mySwaps.length > 0 && (
        <div className="card">
          <h2 className="section-label">Swap History</h2>
          <ul className="swap-history">
            {mySwaps.map(swap => {
              const from = getEmployee(swap.fromId);
              const to   = getEmployee(swap.toId);
              const isOutgoing = swap.fromId === currentUser.id;
              return (
                <li key={swap.id} className="swap-row">
                  <span className={`swap-badge ${swap.status}`}>{swap.status}</span>
                  <span className="swap-desc">
                    {isOutgoing
                      ? `You swapped a task to ${to?.name}`
                      : `${from?.name} swapped a task to you`}
                  </span>
                  <span className="swap-note">{swap.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {swapTarget && (
        <SwapModal task={swapTarget} onClose={() => setSwapTarget(null)} />
      )}
      {completeTarget && (
        <TaskCompletionModal task={completeTarget} onClose={() => setCompleteTarget(null)} />
      )}
    </div>
  );
}

function TaskRow({ task, status, onComplete, onSwap }) {
  const color = CATEGORY_COLORS[task.category] || "amber";
  return (
    <li className={`task-row ${status}`}>
      <div className="task-main">
        <span className={`task-cat cat-${color}`}>{task.category}</span>
        <span className="task-title">{task.title}</span>
      </div>
      {status === "pending" && (
        <div className="task-actions">
          <button className="task-btn complete" onClick={onComplete}>Mark done</button>
          <button className="task-btn swap"     onClick={onSwap}>Swap</button>
        </div>
      )}
      {status === "done" && <span className="done-check">✓</span>}
    </li>
  );
}
