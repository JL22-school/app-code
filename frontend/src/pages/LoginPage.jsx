import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/login", { email, password });
      setMessage("Login successful!");
      console.log(response.data);
      // Store user info in localStorage
      if (response.data.user) {
        localStorage.setItem("userID", response.data.user.userID);
        localStorage.setItem("userEmail", response.data.user.email);
        localStorage.setItem("userName", `${response.data.user.firstName} ${response.data.user.lastName}`);
      }
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
      <p>
        Don’t have an account? <Link to="/register">Register here</Link>
      </p>
      <p>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "5rem auto",
    padding: "2rem",
    border: "1px solid #ddd",
    borderRadius: "10px",
    textAlign: "center",
    backgroundColor: "#fafafa",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    padding: "0.75rem",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default LoginPage;