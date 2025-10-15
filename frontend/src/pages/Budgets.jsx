import React from "react";
import { Link } from "react-router-dom";

export default function Budgets() {
  return (
    <div style={styles.container}>
      <h2>Budgets</h2>
      <p>This is the Budgets page. You can list and manage budgets here.</p>
      <p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "3rem auto",
    padding: "2rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "#fff",
    textAlign: "center",
  },
};
