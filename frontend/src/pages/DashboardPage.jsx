import React from "react";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // For now, just navigate back to login
    // Later, you can clear auth tokens or session data here
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <h1>Welcome to Your Dashboard!</h1>
      <p>You’re logged in successfully 🎉</p>

      <button style={styles.button} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "5rem auto",
    padding: "2rem",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "10px",
    backgroundColor: "#fafafa",
  },
  button: {
    marginTop: "2rem",
    padding: "0.75rem 1.5rem",
    border: "none",
    backgroundColor: "#dc3545",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default DashboardPage;