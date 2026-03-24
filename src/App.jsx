import { useState } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import LoginScreen    from "./screens/LoginScreen";
import EmployeeHome   from "./screens/EmployeeHome";
import ManagerHome    from "./screens/ManagerHome";

function Shell() {
  const { currentUser, setCurrentUser } = useApp();

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-dot" />
          ShiftCheck
        </div>
        <div className="nav-right">
          <span className="nav-user">
            <span className="nav-role-badge" data-role={currentUser.role}>
              {currentUser.role}
            </span>
            {currentUser.name.split(" ")[0]}
          </span>
          <button className="nav-logout" onClick={() => setCurrentUser(null)}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="main">
        {currentUser.role === "manager"
          ? <ManagerHome />
          : <EmployeeHome />
        }
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
