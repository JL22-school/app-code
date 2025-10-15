import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Expenses.css";

function Expenses() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: "",
    notes: "",
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
      expenseDate: formData.date,
      clientID: 1, // static or retrieved from logged-in user later
    };

    const response = await axios.post("http://localhost:5000/api/expenses", payload);

    if (response.status === 200) {
      setMessage("Expense added successfully!");
      setFormData({ category: "", amount: "", date: "", notes: "" });
    }
  } catch (error) {
    console.error(error);
    setMessage("Error adding expense. Please try again.");
  }
};

  return (
    <div className="expenses-container">
      <header className="expenses-header">
        <h1>Add New Expense</h1>
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
          />
        </label>

        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Notes (optional):
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Enter any notes..."
          ></textarea>
        </label>

        <button type="submit" className="submit-btn">
          Add Expense
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

export default Expenses;
