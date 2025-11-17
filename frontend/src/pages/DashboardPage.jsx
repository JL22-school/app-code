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
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('week');

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      console.log(`Fetching expenses for timePeriod: ${timePeriod}`);
      setLoading(true);
      fetch(`http://localhost:5000/api/expenses/weekly?clientID=${userID}&timePeriod=${timePeriod}`)
        .then((res) => res.json())
        .then((data) => {
          console.log(`Received ${data.length} expenses for ${timePeriod}:`, data);
          setWeeklyExpenses(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching expenses:", err);
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

  // Process data for pie chart (Expenses By Category)
  const getPieChartData = () => {
    const categoryTotals = {};
    
    weeklyExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
    });

    const categories = Object.keys(categoryTotals);
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(255, 99, 255, 0.7)',
      'rgba(99, 255, 132, 0.7)',
    ];

    return {
      labels: categories,
      datasets: [
        {
          label: 'Expenses by Category ($)',
          data: categories.map(cat => categoryTotals[cat]),
          backgroundColor: colors.slice(0, categories.length),
          borderColor: colors.slice(0, categories.length).map(c => c.replace('0.7', '1')),
          borderWidth: 1,
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
      },
      title: {
        display: true,
        text: `Expenses by Category Over ${getTimePeriodLabel()}`,
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
            return label + ': $' + value.toFixed(2);
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
            <p>Loading your expense data...</p>
          </div>
        ) : weeklyExpenses.length === 0 ? (
          <div className="chart-placeholder">
            <p>No expenses recorded for this time period. Start tracking your expenses!</p>
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
