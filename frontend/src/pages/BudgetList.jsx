import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Expenses.css';  // We can reuse the CSS for now

export default function BudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/budgets')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setBudgets(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="expense-list-container"><p>Loading budgets...</p></div>;
  if (error) return <div className="expense-list-container"><p>Error: {error}</p></div>;

  return (
    <div className="expense-list-container">
      <div className="expense-list-topbar">
        <button className="return-button" onClick={() => navigate('/dashboard')}>
          ← Return to Dashboard
        </button>
        <h1 className="expense-list-header">Budget List</h1>
      </div>
      <div className="expense-list">
        {budgets.map((budget) => (
          <div
            key={budget.budgetID || budget.id}
            className="expense-card"
          >
            <div className="expense-amount">${budget.amount}</div>
            <div className="expense-details">
              <span className="expense-category">{budget.category}</span>
              <span className="expense-date">
                {budget.timePeriod}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
