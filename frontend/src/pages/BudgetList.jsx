import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Expenses.css';  // We can reuse the CSS for now

export default function BudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch both budgets and expenses
    Promise.all([
      fetch('http://localhost:5000/api/budgets'),
      fetch('http://localhost:5000/api/expenses')
    ])
      .then(async ([budgetsRes, expensesRes]) => {
        if (!budgetsRes.ok || !expensesRes.ok) {
          throw new Error('Network response was not ok');
        }
        const budgetsData = await budgetsRes.json();
        const expensesData = await expensesRes.json();
        
        setBudgets(budgetsData);
        setExpenses(expensesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Function to calculate total spent for a specific category (only enabled expenses)
  const calculateSpentForCategory = (category) => {
    return expenses
      .filter(expense => expense.category === category && Boolean(expense.enabled))
      .reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
  };

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
        {budgets.map((budget) => {
          const spentAmount = calculateSpentForCategory(budget.category);
          const budgetAmount = parseFloat(budget.amount || 0);
          const remainingAmount = budgetAmount - spentAmount;
          const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
          
          return (
            <div
              key={budget.budgetID || budget.id}
              className="expense-card"
            >
              <div className="expense-amount">${budgetAmount.toFixed(2)}</div>
              <div className="expense-details">
                <span className="expense-category">{budget.category}</span>
                <span className="expense-date">
                  {budget.timePeriod}
                </span>
              </div>
              
              {/* Budget Progress Section */}
              <div className="budget-progress-section" style={{ marginTop: '10px' }}>
                <div className="budget-spending-text" style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  ${spentAmount.toFixed(2)}/${budgetAmount.toFixed(2)} spent
                  {remainingAmount >= 0 ? 
                    ` • $${remainingAmount.toFixed(2)} remaining` : 
                    ` • $${Math.abs(remainingAmount).toFixed(2)} over budget`
                  }
                </div>
                
                <div className="budget-progress-bar" style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div 
                    className="budget-progress-fill" 
                    style={{
                      width: `${Math.min(spentPercentage, 100)}%`,
                      height: '100%',
                      backgroundColor: spentPercentage <= 100 ? '#28a745' : '#dc3545',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
