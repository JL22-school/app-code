import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import Budgets from "./pages/BudgetPage";
import Expenses from "./pages/ExpensePage";
import ExpenseList from "./pages/ExpenseList";
import BudgetList from "./pages/BudgetList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expense-list" element={<ExpenseList />} />
        <Route path="/budget-list" element={<BudgetList />} />
      </Routes>
    </Router>
  );
}

export default App;
