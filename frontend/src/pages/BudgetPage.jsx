import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Expenses.css"; // We can reuse the CSS since the structure is similar

function BudgetPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    timePeriod: "monthly", // default to monthly
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        clientID: 1, // static or retrieved from logged-in user later
      };

      const response = await axios.post("http://localhost:5000/api/budgets", payload);

      if (response.status === 200) {
        setMessage("Budget added successfully!");
        setFormData({
          category: "",
          amount: "",
          timePeriod: "monthly",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage("Error adding budget. Please try again.");
    }
  };

  return (
    <div className="expenses-container">
      <header className="expenses-header">
        <h1>Add New Budget</h1>
      </header>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          Category:
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            placeholder="e.g., Groceries, Utilities, Entertainment"
          />
        </label>

        <label>
          Amount ($):
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </label>

        <label>
          Time Period:
          <select
            name="timePeriod"
            value={formData.timePeriod}
            onChange={handleChange}
            required
            style={{
              marginTop: "6px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          >
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>

        <button type="submit" className="submit-btn">
          Add Budget
        </button>

        {message && <p className="status-message">{message}</p>}
      </form>
      
      <button 
        onClick={() => navigate("/dashboard")}
        className="back-btn"
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default BudgetPage;
