import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Expenses.css';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(''); // 'disable' or 'enable'
  
  // Add expense popup state
  const [showAddExpensePopup, setShowAddExpensePopup] = useState(false);
  const [formData, setFormData] = useState({
    selectedCategory: "",
    amount: "",
    date: "",
    notes: "",
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      axios.get(`http://localhost:5000/api/categories?clientID=${userID}`)
        .then(response => {
          setCategories(response.data);
        })
        .catch(error => {
          console.error("Error fetching categories:", error);
        });
    }
  };

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

  // Add expense form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();

    // Validate that a category is selected
    if (!formData.selectedCategory) {
      setMessage("Please select a category.");
      return;
    }

    try {
      const userID = localStorage.getItem("userID");
      
      if (!userID) {
        setMessage("Please log in to add an expense.");
        return;
      }

      const payload = {
        category: formData.selectedCategory,
        amount: formData.amount,
        expenseDate: formData.date,
        notes: formData.notes,
        clientID: parseInt(userID),
      };

      const response = await axios.post("http://localhost:5000/api/expenses", payload);

      if (response.status === 200) {
        setMessage("Expense added successfully!");
        setFormData({ selectedCategory: "", amount: "", date: "", notes: "" });
        fetchExpenses(); // Refresh the expense list
        setTimeout(() => {
          setShowAddExpensePopup(false);
          setMessage("");
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error adding expense. Please try again.");
    }
  };

  const closeAddExpensePopup = () => {
    setShowAddExpensePopup(false);
    setFormData({ selectedCategory: "", amount: "", date: "", notes: "" });
    setMessage("");
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
        <button 
          className="add-expense-btn"
          onClick={() => setShowAddExpensePopup(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Add Expense
        </button>
      </div>
      <div className="expense-list">
        {expenses
          .sort((a, b) => {
            // First sort by enabled status (enabled expenses first)
            const aEnabled = Boolean(a.enabled);
            const bEnabled = Boolean(b.enabled);
            
            if (aEnabled !== bEnabled) {
              return bEnabled - aEnabled; // enabled (true) comes before disabled (false)
            }
            
            // Then sort by date (most recent first)
            const aDate = new Date(a.expenseDate || 0);
            const bDate = new Date(b.expenseDate || 0);
            return bDate - aDate; // newer dates come first
          })
          .map((expense) => {
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

      {/* Add Expense Popup */}
      {showAddExpensePopup && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add New Expense</h2>
              <button
                onClick={closeAddExpensePopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <form className="expense-form" onSubmit={handleAddExpenseSubmit}>
              <label>
                Select Category:
                <select
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleFormChange}
                  required
                  style={{
                    marginTop: "6px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    width: "100%"
                  }}
                >
                  <option value="">-- Select a category --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryID} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount ($):
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    marginTop: "6px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    width: "100%"
                  }}
                />
              </label>

              <label>
                Date:
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                  style={{
                    marginTop: "6px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    width: "100%"
                  }}
                />
              </label>

              <label>
                Notes (optional):
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Enter any notes..."
                  style={{
                    marginTop: "6px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    width: "100%",
                    resize: "vertical"
                  }}
                ></textarea>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={closeAddExpensePopup}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Add Expense
                </button>
              </div>

              {message && <p style={{ textAlign: 'center', marginTop: '10px', color: message.includes('Error') ? '#dc3545' : '#28a745' }}>{message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}