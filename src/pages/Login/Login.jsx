import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle, FiUser, FiLock } from "react-icons/fi";
import "./Login.css";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const result = await login(form.username.trim(), form.password);
      
      if (result.success) {
        if (onLogin) {
          onLogin(form);
        }
        window.location.href = '/';
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      <div className="lg-right">
        <div className="lg-card">
          <div className="lg-card-header">
            <h1 className="lg-title">Super Admin Login</h1>
            <p className="lg-subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div className="lg-error-banner">
              <FiAlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form className="lg-form" onSubmit={handleSubmit} noValidate>
            <div className="lg-field">
              <label className="lg-label" htmlFor="username">Username</label>
              <div className="lg-input-wrap">
                <FiUser className="lg-input-icon" size={15} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="lg-input"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lg-field">
              <div className="lg-label-row">
                <label className="lg-label" htmlFor="password">Password</label>
              </div>
              <div className="lg-input-wrap">
                <FiLock className="lg-input-icon" size={15} />
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  className="lg-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="lg-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="lg-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="lg-spinner" />
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="lg-help-text" style={{ marginTop: '16px' }}>
            <a href="mailto:support@indocrm.com" className="lg-link" style={{ fontSize: '13px' }}>
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

