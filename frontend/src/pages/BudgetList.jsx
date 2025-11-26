import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Expenses.css';  // We can reuse the CSS for now

export default function BudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPastBudgets, setShowPastBudgets] = useState(false);
  
  // Add budget popup state
  const [showAddBudgetPopup, setShowAddBudgetPopup] = useState(false);
  const [formData, setFormData] = useState({
    selectedCategory: "",
    newCategory: "",
    amount: "",
    timePeriod: "monthly", // default to monthly
    startDate: "",
    endDate: "",
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [showPastBudgets]);

  const fetchBudgets = () => {
    setLoading(true);
    const userID = localStorage.getItem("userID");
    const status = showPastBudgets ? 'inactive' : 'active';
    
    // Fetch both budgets and expenses
    Promise.all([
      fetch(`http://localhost:5000/api/budgets?clientID=${userID}&status=${status}`),
      fetch(`http://localhost:5000/api/expenses?clientID=${userID}`)
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
  };

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

  // Function to calculate total spent for a specific category (only enabled expenses)
  const calculateSpentForCategory = (category) => {
    return expenses
      .filter(expense => expense.category === category && Boolean(expense.enabled))
      .reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
  };

  // Function to calculate end date based on start date and time period
  const calculateEndDate = (startDate, timePeriod) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    switch (timePeriod) {
      case "weekly":
        date.setDate(date.getDate() + 6); // Add 6 days (7 days total)
        break;
      case "bi-weekly":
        date.setDate(date.getDate() + 13); // Add 13 days (14 days total)
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        date.setDate(date.getDate() - 1); // Last day of the month
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        date.setDate(date.getDate() - 1);
        break;
      default:
        return "";
    }
    return date.toISOString().split('T')[0];
  };

  // Add budget form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    
    // If changing time period, reset dates
    if (name === 'timePeriod') {
      updates.startDate = '';
      updates.endDate = '';
    }
    
    // If changing start date, calculate end date
    if (name === 'startDate') {
      updates.endDate = calculateEndDate(value, formData.timePeriod);
    }

    // Make dropdown and new category mutually exclusive
    if (name === "selectedCategory" && value) {
      updates.newCategory = "";
    } else if (name === "newCategory" && value) {
      updates.selectedCategory = "";
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleAddBudgetSubmit = async (e) => {
    e.preventDefault();

    // Validate that either a category is selected or a new one is entered
    const finalCategory = formData.selectedCategory || formData.newCategory;
    
    if (!finalCategory) {
      setMessage("Please select a category or enter a new one.");
      return;
    }

    try {
      const userID = localStorage.getItem("userID");
      
      if (!userID) {
        setMessage("Please log in to add a budget.");
        return;
      }

      // If a new category was entered, save it to the database
      if (formData.newCategory) {
        await axios.post("http://localhost:5000/api/categories", {
          clientID: parseInt(userID),
          categoryName: formData.newCategory
        });
        
        // Refresh categories list
        fetchCategories();
      }

      const payload = {
        category: finalCategory,
        amount: formData.amount,
        timePeriod: formData.timePeriod,
        startDate: formData.startDate,
        endDate: formData.endDate,
        clientID: parseInt(userID),
      };

      const response = await axios.post("http://localhost:5000/api/budgets", payload);

      if (response.status === 200) {
        setMessage("Budget added successfully!");
        setFormData({
          selectedCategory: "",
          newCategory: "",
          amount: "",
          timePeriod: "monthly",
          startDate: "",
          endDate: "",
        });
        // Refresh budgets list
        fetchBudgets();
        setTimeout(() => {
          setShowAddBudgetPopup(false);
          setMessage("");
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error adding budget. Please try again.");
    }
  };

  const closeAddBudgetPopup = () => {
    setShowAddBudgetPopup(false);
    setFormData({
      selectedCategory: "",
      newCategory: "",
      amount: "",
      timePeriod: "monthly",
      startDate: "",
      endDate: "",
    });
    setMessage("");
  };

  if (loading) return <div className="expense-list-container"><p>Loading budgets...</p></div>;
  if (error) return <div className="expense-list-container"><p>Error: {error}</p></div>;

  return (
    <div className="expense-list-container">
      <div className="expense-list-topbar">
        <button className="return-button" onClick={() => navigate('/dashboard')}>
          ← Return to Dashboard
        </button>
        <h1 className="expense-list-header">{showPastBudgets ? 'Past Budgets' : 'Active Budgets'}</h1>
        <button 
          className="add-budget-btn"
          onClick={() => setShowAddBudgetPopup(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Create New Budget
        </button>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        marginTop: '10px'
      }}>
        <button 
          onClick={() => setShowPastBudgets(!showPastBudgets)}
          style={{
            padding: "12px 24px",
            backgroundColor: showPastBudgets ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "500",
            transition: "background-color 0.3s"
          }}
        >
          {showPastBudgets ? '← View Active Budgets' : 'View Past Budgets →'}
        </button>
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
              style={{
                opacity: showPastBudgets ? 0.8 : 1,
                borderLeft: showPastBudgets ? '4px solid #dc3545' : '4px solid #28a745'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="expense-amount">${budgetAmount.toFixed(2)}</div>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: showPastBudgets ? '#dc3545' : '#28a745',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {showPastBudgets ? 'INACTIVE' : 'ACTIVE'}
                </span>
              </div>
              <div className="expense-details">
                <span className="expense-category">{budget.category}</span>
                <span className="expense-date">
                  {budget.timePeriod}
                </span>
              </div>
              
              {/* Budget Date Range */}
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Start: {new Date(budget.startDate).toLocaleDateString()}</span>
                <span>End: {new Date(budget.endDate).toLocaleDateString()}</span>
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

      {/* Add Budget Popup */}
      {showAddBudgetPopup && (
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
              <h2>Add New Budget</h2>
              <button
                onClick={closeAddBudgetPopup}
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

            <form className="expense-form" onSubmit={handleAddBudgetSubmit}>
              <label>
                Select Category:
                <select
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleFormChange}
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
                Add New Category:
                <input
                  type="text"
                  name="newCategory"
                  value={formData.newCategory}
                  onChange={handleFormChange}
                  placeholder="Or enter a new category"
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
                Time Period:
                <select
                  name="timePeriod"
                  value={formData.timePeriod}
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
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>

              <label>
                Start Date:
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
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
                End Date:
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  disabled
                  style={{
                    marginTop: "6px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    width: "100%",
                    backgroundColor: "#f5f5f5"
                  }}
                />
                <small style={{ display: "block", color: "#666", marginTop: "4px" }}>
                  {formData.timePeriod === "weekly" ? "(7 days from start)" :
                   formData.timePeriod === "bi-weekly" ? "(14 days from start)" :
                   formData.timePeriod === "monthly" ? "(Until end of month)" :
                   "(Until end of year)"}
                </small>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={closeAddBudgetPopup}
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
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Add Budget
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
