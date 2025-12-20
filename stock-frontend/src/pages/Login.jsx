import { useState, useRef, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { loginUser, registerUser } from "../services/api"; 
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false); 
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter' && !isRegistering) {
      e.preventDefault();
      passwordRef.current.focus();
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextField && nextField.current) {
        nextField.current.focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        // --- REGISTER FLOW ---
        await registerUser({ email: formData.email, password: formData.password, full_name: formData.fullName });
        alert("Account created! Please log in.");
        setIsRegistering(false); // Switch back to login mode
      } else {
        // --- LOGIN FLOW ---
        const response = await loginUser({ email: formData.email, password: formData.password });
        
        // Update auth context and redirect
        login(response.data.user);
        navigate("/"); 
      }
    } catch (err) {
      console.error(err);
      // Show error message from Backend (e.g., "Invalid password")
      setError(err.response?.data?.detail || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus email field on component mount
  useEffect(() => {
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) emailInput.focus();
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">
            {isRegistering ? "Create Account" : "Welcome back"}
          </h1>
          <p className="login-subtitle">
            {isRegistering ? "Join to track your portfolio" : "Sign in to access your account"}
          </p>
        </header>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`login-form ${isRegistering ? 'register-mode' : ''}`} noValidate>
          {/* Show Full Name only if Registering */}
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label required">
                Full Name
              </label>
              <input
                id="fullName"
                className="form-input"
                placeholder="John Doe"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                disabled={loading}
                aria-required="true"
                aria-invalid={!!error}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email
            </label>
            <input
              id="email"
              className="form-input"
              placeholder="you@example.com"
              type="email"
              autoComplete="off"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              required
              disabled={loading}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Password
            </label>
            <input
              id="password"
              ref={passwordRef}
              className="form-input"
              placeholder="••••••••"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              onKeyDown={(e) => handleKeyDown(e, null)}
              required
              disabled={loading}
              minLength={8}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>

          {!isRegistering && (
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${isRegistering ? 'register' : ''} ${loading ? 'loading' : ''}`}
            disabled={loading}
            aria-busy={loading}
            aria-live="polite"
          >
            {loading ? (
              <>
                <span className="sr-only">Processing</span>
                <span aria-hidden="true">
                  {isRegistering ? 'Creating Account...' : 'Signing In...'}
                </span>
              </>
            ) : isRegistering ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="login-link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              disabled={loading}
              aria-pressed={isRegistering}
              aria-label={isRegistering ? 'Switch to sign in' : 'Create new account'}
            >
              {isRegistering ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Login;