import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Expenses.css';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/expenses')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="expense-list-container"><p>Loading expenses...</p></div>;
  if (error) return <div className="expense-list-container"><p>Error: {error}</p></div>;

  return (
    <div className="expense-list-container">
      <div className="expense-list-topbar">
        <button className="return-button" onClick={() => navigate('/dashboard')}>
          ← Return to Dashboard
        </button>
        <h1 className="expense-list-header">Expense List</h1>
      </div>
      <div className="expense-list">
        {expenses.map((expense) => (
          <div
            key={expense.expenseID || expense.id}
            className="expense-card"
          >
            <div className="expense-amount">${expense.amount}</div>
            <div className="expense-details">
              <span className="expense-category">{expense.category}</span>
              <span className="expense-date">
                {expense.expenseDate
                  ? new Date(expense.expenseDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            {expense.notes && (
              <div className="expense-notes">{expense.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}