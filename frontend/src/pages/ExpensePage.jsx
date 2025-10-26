import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Expenses.css";

function Expenses() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    selectedCategory: "",
    newCategory: "",
    amount: "",
    date: "",
    notes: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Make dropdown and new category mutually exclusive
    if (name === "selectedCategory" && value) {
      setFormData(prev => ({ ...prev, selectedCategory: value, newCategory: "" }));
    } else if (name === "newCategory" && value) {
      setFormData(prev => ({ ...prev, newCategory: value, selectedCategory: "" }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that either a category is selected or a new one is entered
    const finalCategory = formData.selectedCategory || formData.newCategory;
    
    if (!finalCategory) {
      setMessage("Please select a category or enter a new one.");
      return;
    }

    // Confirmation dialog
    const confirmMessage = `Are you sure you want to add this expense?\n\nCategory: ${finalCategory}\nAmount: $${formData.amount}\nDate: ${formData.date}\nNotes: ${formData.notes || 'None'}`;
    
    const isConfirmed = window.confirm(confirmMessage);
    
    if (!isConfirmed) {
      setMessage("Expense not added - confirmation cancelled.");
      return;
    }

    try {
      const userID = localStorage.getItem("userID");
      
      if (!userID) {
        setMessage("Please log in to add an expense.");
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
        expenseDate: formData.date,
        notes: formData.notes,
        clientID: parseInt(userID),
      };

      const response = await axios.post("http://localhost:5000/api/expenses", payload);

      if (response.status === 200) {
        setMessage("Expense added successfully!");
        setFormData({ selectedCategory: "", newCategory: "", amount: "", date: "", notes: "" });
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
