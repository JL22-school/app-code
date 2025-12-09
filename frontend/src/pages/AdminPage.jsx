import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "client",
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", formData);
      setMessage("User created successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "client",
      });
      setShowCreateModal(false);
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(
        error.response?.data?.error || "Failed to create user"
      );
    }
  };

  const handleDeleteUser = async (userID) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(`/api/users/${userID}`);
        setMessage("User deleted successfully!");
        fetchUsers();
        setTimeout(() => setMessage(""), 3000);
      } catch (error) {
        setMessage(error.response?.data?.error || "Failed to delete user");
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) {
      setMessage("Please enter a temporary password");
      return;
    }
    try {
      await axios.put(`/api/users/${selectedUserForReset.userID}/reset-password`, {
        newPassword: resetPassword,
      });
      setMessage(`Password reset successfully for ${selectedUserForReset.firstName}!`);
      setResetPassword("");
      setShowResetModal(false);
      setSelectedUserForReset(null);
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to reset password");
    }
  };

  const openResetModal = (user) => {
    setSelectedUserForReset(user);
    setResetPassword("");
    setShowResetModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Message display */}
      {message && <div className="admin-message">{message}</div>}

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-controls">
          <h2>User Management</h2>
          <button
            className="create-user-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New User
          </button>
        </div>

        {/* Users table */}
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userID}>
                    <td>{user.userID}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="reset-button"
                        onClick={() => openResetModal(user)}
                      >
                        Reset Password
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteUser(user.userID)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create user modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New User</h2>
            <form onSubmit={handleCreateUser} className="admin-form">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter last name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-button">
                  Create User
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {showResetModal && selectedUserForReset && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reset Password</h2>
            <p>Reset password for: <strong>{selectedUserForReset.email}</strong></p>
            <form onSubmit={handleResetPassword} className="admin-form">
              <div className="form-group">
                <label htmlFor="resetPassword">Temporary Password</label>
                <input
                  type="text"
                  id="resetPassword"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  placeholder="Enter temporary password"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-button">
                  Set Password
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
