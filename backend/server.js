const express = require("express");
const cors = require("cors");
const db = require("./db"); // <-- import database
const bcrypt = require("bcrypt");
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.post("/api/expenses", (req, res) => {
  const { clientID, amount, category, expenseDate, notes } = req.body;

  const query = `
    INSERT INTO Expenses (clientID, amount, category, expenseDate, notes, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [clientID, amount, category, expenseDate || new Date().toISOString(), notes, 1],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ expenseID: this.lastID });
      }
    }
  );
});

// Get all expenses (optionally filter by clientID)
app.get("/api/expenses", (req, res) => {
  const { clientID } = req.query;
  let query = "SELECT * FROM Expenses";
  let params = [];

  if (clientID) {
    query += " WHERE clientID = ?";
    params.push(clientID);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new user (with password hashing)
app.post("/api/users", (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Check if email already exists
  const checkQuery = "SELECT email FROM Users WHERE email = ?";
  db.get(checkQuery, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        return res.status(500).json({ error: hashErr.message });
      }

      // Insert new user
      const insertQuery = `
        INSERT INTO Users (firstName, lastName, email, password, role)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(
        insertQuery,
        [firstName, lastName, email, hashedPassword, role || "client"],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }
          res.json({ userID: this.lastID });
        }
      );
    });
  });
});

// Get all users
app.get("/api/users", (req, res) => {
  db.all(`SELECT * FROM Users`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Start server (single listener)
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ----------------- UPDATE AN EXPENSE -----------------
app.put("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const { amount, category, expenseDate, notes } = req.body;

  const query = `
    UPDATE Expenses
    SET amount = ?, category = ?, expenseDate = ?, notes = ?
    WHERE expenseID = ?
  `;

  db.run(
    query,
    [amount, category, expenseDate, notes, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ message: "Expense not found" });
      } else {
        res.json({ message: "Expense updated successfully" });
      }
    }
  );
});

// ----------------- DELETE AN EXPENSE -----------------
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM Expenses WHERE expenseID = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: "Expense not found" });
    } else {
      res.json({ message: "Expense deleted successfully" });
    }
  });
});

// ----------------- TOGGLE EXPENSE ENABLED STATUS -----------------
app.patch("/api/expenses/:id/toggle", (req, res) => {
  const { id } = req.params;

  // First get the current enabled status
  const getQuery = `SELECT enabled FROM Expenses WHERE expenseID = ?`;
  
  db.get(getQuery, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ message: "Expense not found" });
    } else {
      // Toggle the enabled status
      const newStatus = row.enabled ? 0 : 1;
      const updateQuery = `UPDATE Expenses SET enabled = ? WHERE expenseID = ?`;
      
      db.run(updateQuery, [newStatus, id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ 
            message: `Expense ${newStatus ? 'enabled' : 'disabled'} successfully`,
            enabled: newStatus === 1
          });
        }
      });
    }
  });
});

// Add a new budget
app.post("/api/budgets", (req, res) => {
  const { clientID, category, amount, timePeriod, startDate, endDate } = req.body;

  // Validate required fields
  if (!clientID || !category || !amount || !timePeriod || !startDate || !endDate) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    INSERT INTO Budgets (clientID, category, amount, timePeriod, startDate, endDate)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [clientID, category, amount, timePeriod, startDate, endDate], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ budgetID: this.lastID });
    }
  });
});

// Get all budgets (optionally filter by clientID)
app.get("/api/budgets", (req, res) => {
  const { clientID } = req.query;
  let query = "SELECT * FROM Budgets";
  let params = [];

  if (clientID) {
    query += " WHERE clientID = ?";
    params.push(clientID);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// ----------------- UPDATE A BUDGET -----------------
app.put("/api/budgets/:id", (req, res) => {
  const { id } = req.params;
  const { category, amount, timePeriod } = req.body;

  const query = `
    UPDATE Budgets
    SET category = ?, amount = ?, timePeriod = ?
    WHERE budgetID = ?
  `;

  db.run(query, [category, amount, timePeriod, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: "Budget not found" });
    } else {
      res.json({ message: "Budget updated successfully" });
    }
  });
});

// ----------------- DELETE A BUDGET -----------------
app.delete("/api/budgets/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM Budgets WHERE budgetID = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: "Budget not found" });
    } else {
      res.json({ message: "Budget deleted successfully" });
    }
  });
});

// ----------------- CATEGORIES ENDPOINTS -----------------
// Get categories for a specific user
app.get("/api/categories", (req, res) => {
  const { clientID } = req.query;
  
  if (!clientID) {
    return res.status(400).json({ error: "clientID is required" });
  }

  const query = "SELECT * FROM Categories WHERE clientID = ? ORDER BY categoryName";

  db.all(query, [clientID], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new category for a user
app.post("/api/categories", (req, res) => {
  const { clientID, categoryName } = req.body;

  if (!clientID || !categoryName) {
    return res.status(400).json({ error: "clientID and categoryName are required" });
  }

  const query = `
    INSERT INTO Categories (clientID, categoryName)
    VALUES (?, ?)
  `;

  db.run(query, [clientID, categoryName], function (err) {
    if (err) {
      // Check if it's a unique constraint violation (category already exists)
      if (err.message.includes("UNIQUE")) {
        res.status(200).json({ message: "Category already exists", categoryID: null });
      } else {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json({ categoryID: this.lastID, message: "Category added successfully" });
    }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const query = `SELECT * FROM Users WHERE email = ?`;

  db.get(query, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare supplied password with stored hashed password
    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr) return res.status(500).json({ error: compareErr.message });
      if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

      // Successful login - return user without password
      return res.json({
        message: "Login successful",
        user: {
          userID: user.userID,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    });
  });
});