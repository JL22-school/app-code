import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Expenses.css';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(''); // 'disable' or 'enable'
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = () => {
    const userID = localStorage.getItem("userID");
    
    if (!userID) {
      setError("Please log in to view your expenses");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/expenses?clientID=${userID}`)
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
  };

  const handleToggleExpense = (expense, action) => {
    setSelectedExpense(expense);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const confirmToggleExpense = async () => {
    if (!selectedExpense) return;

    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${selectedExpense.expenseID}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Toggle result:', result);
        // Refresh the expenses list
        fetchExpenses();
        setShowConfirmDialog(false);
        setSelectedExpense(null);
        setActionType('');
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to toggle expense status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error toggling expense:', err);
      setError(`Failed to update expense status: ${err.message}`);
    }
  };

  const cancelToggleExpense = () => {
    setShowConfirmDialog(false);
    setSelectedExpense(null);
    setActionType('');
  };

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
        {expenses.map((expense) => {
          // Handle both boolean and numeric enabled values from SQLite
          const isEnabled = Boolean(expense.enabled);
          
          return (
            <div
              key={expense.expenseID || expense.id}
              className={`expense-card ${!isEnabled ? 'expense-disabled' : ''}`}
              style={{
                opacity: isEnabled ? 1 : 0.6,
                position: 'relative',
                paddingBottom: '40px' // Add padding to make room for button
              }}
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
              
              {/* Enable/Disable Button */}
              <button
                className={`expense-toggle-btn ${isEnabled ? 'disable-btn' : 'enable-btn'}`}
                onClick={() => handleToggleExpense(expense, isEnabled ? 'disable' : 'enable')}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: isEnabled ? '#dc3545' : '#28a745',
                  color: 'white'
                }}
              >
                {isEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to {actionType} this expense?
              {actionType === 'disable' && ' This expense will not count towards any budget calculations.'}
              {actionType === 'enable' && ' This expense will be included in budget calculations again.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={cancelToggleExpense}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleExpense}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: actionType === 'disable' ? '#dc3545' : '#28a745',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {actionType === 'disable' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}