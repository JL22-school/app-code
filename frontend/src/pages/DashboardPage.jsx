import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import "./Dashboard.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();
  const [weeklyExpenses, setWeeklyExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('week');

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      console.log(`Fetching expenses for timePeriod: ${timePeriod}`);
      setLoading(true);
      Promise.all([
        fetch(`http://localhost:5000/api/expenses/weekly?clientID=${userID}&timePeriod=${timePeriod}`),
        fetch(`http://localhost:5000/api/budgets?clientID=${userID}&status=active`)
      ])
        .then(([expensesRes, budgetsRes]) => Promise.all([expensesRes.json(), budgetsRes.json()]))
        .then(([expensesData, budgetsData]) => {
          console.log(`Received ${expensesData.length} expenses for ${timePeriod}:`, expensesData);
          console.log(`Received ${budgetsData.length} active budgets:`, budgetsData);
          setWeeklyExpenses(expensesData);
          setBudgets(budgetsData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching data:", err);
          setLoading(false);
        });
    }
  }, [timePeriod]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("userID");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    // App's login route is mounted at `/` so navigate there on logout
    navigate("/");
  };

  // Process data for bar chart (Total Expenses By Day)
  const getBarChartData = () => {
    const daysList = [];
    const today = new Date();
    let numDays;
    
    // Determine number of days to show based on time period
    if (timePeriod === 'week') {
      numDays = 7;
    } else if (timePeriod === 'month') {
      numDays = 30;
    } else {
      // For 'all', find the earliest expense date
      if (weeklyExpenses.length === 0) return { labels: [], datasets: [] };
      const dates = weeklyExpenses.map(e => new Date(e.expenseDate).getTime());
      const earliestDate = new Date(Math.min(...dates));
      const daysDiff = Math.ceil((today - earliestDate) / (1000 * 60 * 60 * 24));
      numDays = Math.max(daysDiff + 1, 7); // At least 7 days
    }
    
    // Generate days list
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      daysList.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: 0
      });
    }

    // Sum expenses by day
    weeklyExpenses.forEach(expense => {
      const expenseDate = new Date(expense.expenseDate).toISOString().split('T')[0];
      const dayData = daysList.find(d => d.date === expenseDate);
      if (dayData) {
        dayData.total += parseFloat(expense.amount);
      }
    });

    return {
      labels: daysList.map(d => d.label),
      datasets: [
        {
          label: 'Total Expenses ($)',
          data: daysList.map(d => d.total),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Process data for pie chart (Budget Categories with Spent/Remaining)
  const getPieChartData = () => {
    if (budgets.length === 0) return { labels: [], datasets: [] };

    // Calculate spent amount per category
    const spentByCategory = {};
    weeklyExpenses.forEach(expense => {
      const category = expense.category;
      spentByCategory[category] = (spentByCategory[category] || 0) + parseFloat(expense.amount);
    });

    // Prepare data for each budget category
    const labels = [];
    const spentData = [];
    const backgroundColors = [];
    const borderColors = [];
    
    const baseColors = [
      { base: 'rgba(54, 162, 235', overBudget: 'rgba(220, 53, 69' },
      { base: 'rgba(75, 192, 192', overBudget: 'rgba(220, 53, 69' },
      { base: 'rgba(153, 102, 255', overBudget: 'rgba(220, 53, 69' },
      { base: 'rgba(255, 159, 64', overBudget: 'rgba(220, 53, 69' },
      { base: 'rgba(255, 206, 86', overBudget: 'rgba(220, 53, 69' },
      { base: 'rgba(99, 255, 132', overBudget: 'rgba(220, 53, 69' },
    ];

    budgets.forEach((budget, index) => {
      const spent = spentByCategory[budget.category] || 0;
      const budgetAmount = parseFloat(budget.amount);
      const remaining = Math.max(0, budgetAmount - spent);
      const isOverBudget = spent > budgetAmount;
      
      const colorPair = baseColors[index % baseColors.length];
      const baseColor = isOverBudget ? colorPair.overBudget : colorPair.base;
      
      // Remaining portion (lighter) - add first so it appears on the right
      if (!isOverBudget && remaining > 0) {
        labels.push(`${budget.category} (Remaining)`);
        spentData.push(remaining);
        backgroundColors.push(`${baseColor}, 0.3)`);
        borderColors.push(`${baseColor}, 0.5)`);
      }
      
      // Spent portion (darker) - add second so it appears on the left
      labels.push(`${budget.category} (Spent)`);
      spentData.push(Math.min(spent, budgetAmount));
      backgroundColors.push(`${baseColor}, 0.9)`);
      borderColors.push(`${baseColor}, 1)`);
    });

    return {
      labels: labels,
      datasets: [
        {
          label: 'Budget Status ($)',
          data: spentData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          // Store metadata for tooltip callbacks
          _spentByCategory: spentByCategory,
          _budgets: budgets,
        },
      ],
    };
  };

  const getTimePeriodLabel = () => {
    if (timePeriod === 'week') return 'the Last Week';
    if (timePeriod === 'month') return 'the Last Month';
    return 'All Time';
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Total Expenses By Day Over ${getTimePeriodLabel()}`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 10
          },
          padding: 8
        }
      },
      title: {
        display: true,
        text: `Budget Status by Category`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const category = label.replace(' (Spent)', '').replace(' (Remaining)', '');
            
            // Access metadata from dataset
            const spentByCategory = context.dataset._spentByCategory || {};
            const budgets = context.dataset._budgets || [];
            
            // Find the budget for this category to check if over budget
            const budget = budgets.find(b => b.category === category);
            if (!budget) return label + ': $' + value.toFixed(2);
            
            const spent = spentByCategory[category] || 0;
            const budgetAmount = parseFloat(budget.amount);
            const isOverBudget = spent > budgetAmount;
            
            // Check if this is a spent segment
            if (label.includes('(Spent)')) {
              if (isOverBudget) {
                const overAmount = spent - budgetAmount;
                return [
                  `⚠️ WARNING: Over Budget!`,
                  `Budget: $${budgetAmount.toFixed(2)}`,
                  `Spent: $${spent.toFixed(2)}`,
                  `Over by: $${overAmount.toFixed(2)}`
                ];
              } else {
                return `Spent: $${value.toFixed(2)}`;
              }
            } else if (label.includes('(Remaining)')) {
              return `Remaining: $${value.toFixed(2)}`;
            }
            
            return label + ': $' + value.toFixed(2);
          },
          title: function(context) {
            const label = context[0].label || '';
            const category = label.replace(' (Spent)', '').replace(' (Remaining)', '');
            return category;
          }
        }
      }
    },
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Budget Buddy</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Main content area */}
      <main className="dashboard-main">
        {loading ? (
          <div className="chart-placeholder">
            <p>Loading your data...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="chart-placeholder">
            <p>No active budgets found. Create a budget to see your spending analysis!</p>
          </div>
        ) : (
          <div className="charts-container">
            <div className="chart-box">
              <Bar key={`bar-${timePeriod}`} data={getBarChartData()} options={barOptions} />
            </div>
            <div className="chart-box">
              <Pie key={`pie-${timePeriod}`} data={getPieChartData()} options={pieOptions} />
            </div>
          </div>
        )}
        
        <div className="time-period-selector">
          <label htmlFor="timePeriod">View: </label>
          <select 
            id="timePeriod"
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value)}
            className="time-period-dropdown"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </main>

      {/* Corner buttons */}
      <div className="button-container">
        <button
          className="dashboard-button"
          onClick={() => navigate("/budget-list")}
        >
          📋 Manage Budgets
        </button>

        <button
          className="dashboard-button"
          onClick={() => navigate("/expense-list")}
        >
          📋 Manage Expenses
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
