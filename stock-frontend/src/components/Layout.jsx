import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/learn", label: "Learn" },
  { to: "/compare", label: "Compare" },
];

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("ai-stock-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(getInitialTheme);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem("ai-stock-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate("/login");
  };

  return (
    <div className="app-root">
      {/* NAVBAR */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">AI Stock</div>
          <span className="app-subtitle">Smart market insights</span>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                location.pathname === item.to
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              {item.label}
            </Link>
          ))}

          {/* THEME TOGGLE */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
          >
            <span>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</span>
          </button>

          {/* LOGIN / PROFILE */}
          {user ? (
            <div className="nav-profile">
              <div className="profile-wrapper">
                <div
                  className="nav-avatar"
                  onClick={() => setShowMenu(!showMenu)}
                  title={user.full_name}
                >
                  {user.profile_pic ? (
                    <img 
                      src={user.profile_pic} 
                      alt={user.full_name} 
                      className="profile-pic"
                    />
                  ) : (
                    <span className="avatar-text">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {showMenu && (
                  <div className="nav-profile-dropdown">
                    <div className="profile-header">
                      {user.profile_pic && (
                        <img 
                          src={user.profile_pic} 
                          alt={user.full_name}
                          className="profile-dropdown-pic"
                        />
                      )}
                      <div className="profile-info">
                        <div className="nav-profile-name">{user.full_name}</div>
                        <div className="nav-profile-email">{user.email || 'View Profile'}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <span className="dropdown-icon">👤</span> My Profile
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleLogout}
                      className="dropdown-item logout-item"
                    >
                      <span className="dropdown-icon">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              className="nav-login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </nav>
      </header>

      {/* PAGE CONTENT */}
      <main className="app-main">
        <div className="page-shell">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {location.pathname === "/"
                  ? "Market overview"
                  : location.pathname === "/watchlist"
                  ? "Watchlist"
                  : location.pathname === "/learn"
                  ? "Stock Academy"
                  : location.pathname === "/compare"
                  ? "Stock Comparison"
                  : "Account"}
              </h1>
              <p className="page-description">
                {location.pathname === "/"
                  ? "Track live prices, AI forecasts, and market mood in one place."
                  : location.pathname === "/watchlist"
                  ? "Pin the symbols that matter to you and monitor them quickly."
                  : location.pathname === "/learn"
                  ? "Master the basics of investing, one concept at a time."
                  : location.pathname === "/compare"
                  ? "Compare performance and fundamentals side by side."
                  : "Manage your account."}
              </p>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
