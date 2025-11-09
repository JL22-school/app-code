import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // We'll create this next

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("userID");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    // App's login route is mounted at `/` so navigate there on logout
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Main content area */}
      <main className="dashboard-main">
        <h2>Welcome to Your Dashboard</h2>
        <p>Manage your budgets and expenses easily.</p>

        <div className="chart-placeholder">
          <p>(Your charts and summaries will appear here)</p>
        </div>
      </main>

      {/* Corner buttons */}
      <div className="button-container">
        <button
          className="dashboard-button"
          onClick={() => navigate("/budget-list")}
        >
          📋 Manage Budgets
        </button>

        <button
          className="dashboard-button"
          onClick={() => navigate("/expense-list")}
        >
          📋 Manage Expenses
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
