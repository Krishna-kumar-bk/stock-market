import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

 // In ForgotPassword.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage({ type: '', text: '' });

  try {
    const response = await forgotPassword(email); // Just pass the email directly
    setMessage({
      type: 'success',
      text: response.message || 'Password reset link has been sent to your email.'
    });
  } catch (error) {
    console.error('Error:', error);
    setMessage({
      type: 'error',
      text: error.response?.data?.detail || 'Failed to send reset link. Please try again.'
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-logo">Stock Market</div>
        <h1 className="forgot-password-title">Forgot Password</h1>
        <p className="forgot-password-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autocomplete="off"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="back-to-login">
          Remember your password? <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;