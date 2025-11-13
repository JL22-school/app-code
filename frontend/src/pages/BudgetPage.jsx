import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Expenses.css"; // We can reuse the CSS since the structure is similar

function BudgetPage() {
  const navigate = useNavigate();
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

  // Fetch user's existing categories on component mount
  useEffect(() => {
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
  }, []);

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

  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
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
        const categoriesResponse = await axios.get(`http://localhost:5000/api/categories?clientID=${userID}`);
        setCategories(categoriesResponse.data);
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
          Select Category:
          <select
            name="selectedCategory"
            value={formData.selectedCategory}
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="Or enter a new category"
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

        <label>
          Start Date:
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            style={{
              marginTop: "6px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "1rem",
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
              backgroundColor: "#f5f5f5",
            }}
          />
          <small style={{ display: "block", color: "#666", marginTop: "4px" }}>
            {formData.timePeriod === "weekly" ? "(7 days from start)" :
             formData.timePeriod === "bi-weekly" ? "(14 days from start)" :
             formData.timePeriod === "monthly" ? "(Until end of month)" :
             "(Until end of year)"}
          </small>
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
