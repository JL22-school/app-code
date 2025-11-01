const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to the database file
const dbPath = path.resolve(__dirname, "database.sqlite");

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create tables if they don’t exist
db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS Users (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);
});

db.run(`
  CREATE TABLE IF NOT EXISTS Expenses (
    expenseID INTEGER PRIMARY KEY AUTOINCREMENT,
    clientID INTEGER,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    expenseDate TEXT DEFAULT (datetime('now')),
    notes TEXT,
    FOREIGN KEY(clientID) REFERENCES Users(userID)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS Budgets (
    budgetID INTEGER PRIMARY KEY AUTOINCREMENT,
    clientID INTEGER,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    timePeriod TEXT NOT NULL CHECK (timePeriod IN ('weekly', 'bi-weekly', 'monthly', 'yearly')),
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(clientID) REFERENCES Users(userID)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS Categories (
    categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    clientID INTEGER,
    categoryName TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(clientID) REFERENCES Users(userID),
    UNIQUE(clientID, categoryName)
  )
`);



module.exports = db;

