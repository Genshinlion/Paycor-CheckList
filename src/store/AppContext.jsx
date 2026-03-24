import { createContext, useContext, useState } from "react";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_EMPLOYEES = [
  { id: "e1", name: "Marcus Rivera",  phone: "+15550102030", role: "employee" },
  { id: "e2", name: "Priya Nair",     phone: "+15550405060", role: "employee" },
  { id: "e3", name: "Devon Walsh",    phone: "+15550708090", role: "employee" },
  { id: "e4", name: "Keisha Brown",   phone: "+15551112131", role: "employee" },
  { id: "m1", name: "Jordan Lee",     phone: "+15559990001", role: "manager"  },
];

const INITIAL_TASKS = [
  { id: "t1", title: "Open register & verify cash drawer",   assignedTo: "e1", recurring: true,  category: "Operations" },
  { id: "t2", title: "Restock shelves in zones A–C",          assignedTo: "e2", recurring: true,  category: "Stocking"   },
  { id: "t3", title: "Clean and sanitize break room",         assignedTo: "e3", recurring: true,  category: "Facilities" },
  { id: "t4", title: "Compile daily sales report",            assignedTo: "e1", recurring: true,  category: "Operations" },
  { id: "t5", title: "Equipment check & maintenance log",     assignedTo: "e4", recurring: true,  category: "Facilities" },
  { id: "t6", title: "Complete customer service callbacks",   assignedTo: "e2", recurring: true,  category: "Customer"   },
  { id: "t7", title: "End-of-day inventory count",            assignedTo: "e3", recurring: true,  category: "Stocking"   },
  { id: "t8", title: "Lock up & set alarm",                   assignedTo: "e4", recurring: true,  category: "Operations" },
];

// swap requests: { id, taskId, fromId, toId, reason, status, createdAt }
const INITIAL_SWAPS = [];

// completions for today: { taskId, employeeId, completedAt, notes }
const INITIAL_COMPLETIONS = [];

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [employees]   = useState(INITIAL_EMPLOYEES);
  const [tasks,        setTasks]       = useState(INITIAL_TASKS);
  const [swaps,        setSwaps]       = useState(INITIAL_SWAPS);
  const [completions,  setCompletions] = useState(INITIAL_COMPLETIONS);
  const [currentUser,  setCurrentUser] = useState(null); // selected on login screen

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  const addTask = (task) =>
    setTasks(prev => [...prev, { ...task, id: `t${Date.now()}` }]);

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const reassignTask = (taskId, newEmployeeId) =>
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: newEmployeeId } : t));

  // ── Swap requests ──────────────────────────────────────────────────────────
  const requestSwap = (taskId, fromId, toId, reason) => {
    const swap = {
      id: `s${Date.now()}`,
      taskId, fromId, toId, reason,
      status: "approved", // auto-approved per spec
      createdAt: new Date().toISOString(),
    };
    setSwaps(prev => [...prev, swap]);
    // auto-approve: reassign the task
    reassignTask(taskId, toId);
    return swap;
  };

  // ── Completions ────────────────────────────────────────────────────────────
  const completeTask = (taskId, employeeId, notes) => {
    setCompletions(prev => [
      ...prev.filter(c => c.taskId !== taskId),
      { taskId, employeeId, notes, completedAt: new Date().toISOString() },
    ]);
  };

  const isCompleted = (taskId) => completions.some(c => c.taskId === taskId);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getEmployee  = (id) => employees.find(e => e.id === id);
  const getTask      = (id) => tasks.find(t => t.id === id);
  const tasksFor     = (empId) => tasks.filter(t => t.assignedTo === empId);
  const managers     = employees.filter(e => e.role === "manager");
  const nonManagers  = employees.filter(e => e.role === "employee");

  return (
    <AppContext.Provider value={{
      employees, managers, nonManagers,
      tasks, addTask, updateTask, deleteTask, reassignTask,
      swaps, requestSwap,
      completions, completeTask, isCompleted,
      currentUser, setCurrentUser,
      getEmployee, getTask, tasksFor,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
