import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  fetchQuote, 
  fetchHistory, 
  fetchPrediction, 
  addToWatchlist, 
  fetchStockNews, 
  createAlert 
} from "../services/api"; 
import SearchBar from "../components/SearchBar";
import StatsCards from "../components/StatsCards";
import PredictionCard from "../components/PredictionCard";
import PriceChart from "../components/PriceChart"; 
import MiniChart from "../components/MiniChart"; 
import "./Dashboard.css";

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultSymbol = searchParams.get("symbol");
  const [symbol, setSymbol] = useState(defaultSymbol || null);

  // --- USER STATE ---
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user"))); 
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // --- EDIT PROFILE INPUTS ---
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // --- PORTFOLIO & ALERT STATE ---
  const [qty, setQty] = useState(1);
  const [buyPrice, setBuyPrice] = useState("");
  const [alertPrice, setAlertPrice] = useState(""); 
  const [condition, setCondition] = useState("ABOVE");

  // --- DATA STATES ---
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [news, setNews] = useState([]);
  const [marketIndices, setMarketIndices] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const refreshInterval = useRef(null); 

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowProfileMenu(false);
  };

  const openEditModal = () => {
    if (!user) return;
    setEditName(user.full_name);
    setEditEmail(user.email);
    setEditPassword("");
    setShowEditModal(true);
    setShowProfileMenu(false);
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          email: editEmail,
          password: editPassword || null 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Update failed");
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("✅ Profile Updated Successfully!");
      setShowEditModal(false);
    } catch (err) { alert("❌ Error: " + err.message); }
  };

  const handleSetAlert = async () => {
    if (!user) return alert("Please login to set alerts.");
    const target = parseFloat(alertPrice);
    if (!target || isNaN(target)) return alert("Please enter a valid target price.");
    try {
      await createAlert({ user_id: user.id, symbol, target_price: target, condition });
      alert(`✅ Alert set! Notification when ${symbol} goes ${condition} ${target}.`);
    } catch (e) { console.error(e); alert("Failed to set alert."); }
  };

  const handleAddWatchlist = async () => {
    if (!user) return alert("Please login to save stocks!");
    try {
      await addToWatchlist({ user_id: user.id, symbol, quantity: Number(qty), buy_price: Number(buyPrice) });
      alert(`${symbol} added to your Portfolio! 💰`);
    } catch (err) { alert(err.response?.data?.detail || "Could not add to watchlist"); }
  };

  const handleSearch = (sym) => { setSymbol(sym); setSearchParams({ symbol: sym }); };

  // --- EFFECTS ---
  useEffect(() => {
    if (refreshInterval.current) clearInterval(refreshInterval.current);
    if (symbol) {
      loadStockData(symbol);
      refreshInterval.current = setInterval(() => refreshPriceOnly(symbol), 10000); 
    } else {
      loadMarketOverview(); 
      refreshInterval.current = setInterval(() => loadMarketOverview(true), 10000); 
    }
    return () => clearInterval(refreshInterval.current);
  }, [symbol]);

  const loadStockData = async (sym) => {
    try {
      setLoading(true);
      setError("");
      // Sequential calls to avoid overwhelming backend
      const qRes = await fetchQuote(sym);
      const hRes = await fetchHistory(sym, "6mo");
      const pRes = await fetchPrediction(sym);
      const nRes = await fetchStockNews(sym);
      
      setQuote(qRes.data);
      setBuyPrice(qRes.data.price); 
      setAlertPrice(qRes.data.price);
      setHistory(hRes.data || []);
      setPrediction(pRes.data);
      setNews(nRes.data || []);
    } catch (e) { 
      console.error(e);
      // Don't show error message, just log to console
    } finally { 
      setLoading(false); 
    }
  };

  const refreshPriceOnly = async (sym) => {
    try { const qRes = await fetchQuote(sym); setQuote(qRes.data); } catch (e) {}
  };

  const loadMarketOverview = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const indices = ["^NSEI", "^BSESN", "BTC-USD"]; 
      const niceNames = { "^NSEI": "NIFTY 50", "^BSESN": "SENSEX", "BTC-USD": "BITCOIN" };

      if (isSilent) {
        // Sequential calls to avoid overwhelming backend
        const results = [];
        for (const idx of indices) {
          try {
            const res = await fetchQuote(idx);
            results.push(res);
          } catch (e) {
            console.error(`Failed to fetch ${idx}:`, e);
            results.push({ data: { price: 0, change: 0, changePercent: 0 } });
          }
        }
        setMarketIndices(prevIndices => {
            return prevIndices.map((prevItem, index) => {
                const newData = results[index].data;
                return {
                    ...prevItem, 
                    price: newData.price,
                    change: newData.change,
                    changePercent: newData.changePercent
                };
            });
        });
      } else {
        // Sequential calls with delay for initial load
        const results = [];
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          try {
            const quoteRes = await fetchQuote(idx);
            const historyRes = await fetchHistory(idx, "1mo"); 
            results.push({ 
                ...quoteRes.data, 
                history: historyRes.data || [], 
                displayName: niceNames[idx] || idx 
            });
            // Add small delay between requests
            if (i < indices.length - 1) await new Promise(resolve => setTimeout(resolve, 200));
          } catch (e) {
            console.error(`Failed to fetch ${idx}:`, e);
            results.push({ 
                price: 0, change: 0, changePercent: 0, 
                history: [], displayName: niceNames[idx] || idx 
            });
          }
        }
        setMarketIndices(results);
      }
    } catch (e) { console.error("Market overview error:", e); } finally { if (!isSilent) setLoading(false); }
  };

  return (
    <div className="dashboard-container">
      
      {/* HEADER ROW */}
      <div className="dashboard-header-row">
        <div className="search-wrapper">
            <SearchBar defaultSymbol={symbol || ""} onSearch={handleSearch} />
            <div className="search-tip">
                💡 Tip: For Indian stocks, add <b>.NS</b> (e.g., <i>HDFCBANK.NS</i>)
            </div>
        </div>

        {/* PROFILE ICON
        <div className="profile-wrapper-outer">
          {user ? (
            <div className="profile-container">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="profile-icon"
                title={user.full_name}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    Signed in as <br/> <strong>{user.full_name}</strong>
                    <div style={{fontSize:'0.75rem', marginTop:'2px'}}>{user.email}</div>
                  </div>
                  <button onClick={openEditModal} className="profile-menu-item">✏️ Edit Profile</button>
                  <button onClick={handleLogout} className="profile-menu-item danger">🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => window.location.href = "/login"} className="login-btn">Login</button>
          )}
        </div> */}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px', marginTop: 0 }}>Edit Profile</h2>
            <div style={{ marginBottom: '15px' }}>
              <label className="modal-label">Full Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="modal-input" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="modal-label">Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="modal-input" />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label className="modal-label">New Password (Optional)</label>
              <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Leave blank to keep current" className="modal-input" />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={handleUpdateProfile} className="modal-btn save">Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="modal-btn cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR HANDLING */}
      {error && (
        <div className="error-message">
            <span>⚠️ {error}</span>
            {symbol && !symbol.includes(".NS") && !symbol.includes(".BO") && (
                <button className="smart-retry-btn" onClick={() => handleSearch(symbol + ".NS")}>
                    👉 Did you mean {symbol}.NS?
                </button>
            )}
        </div>
      )}

      {symbol && quote ? (
        <>
          {/* CONTROLS BAR */}
          <div className="controls-bar">
            
            <div className="control-group small-input">
                <label>Qty</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} />
            </div>

            <div className="control-group">
                <label>Buy Price</label>
                <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
            </div>

            {/* ACTION BUTTON WRAPPER */}
            <div className="control-group action-group">
                <label className="hide-mobile">&nbsp;</label> 
                <button onClick={handleAddWatchlist} className="action-btn orange">
                    {user ? "+ Add" : "🔒 Login"}
                </button>
            </div>

            <div className="divider hide-mobile"></div>

            <div className="control-group">
                <label>Target Price</label>
                <input type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} />
            </div>

            <div className="control-group">
                <label>Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)}>
                    <option value="ABOVE">Above (📈)</option>
                    <option value="BELOW">Below (📉)</option>
                </select>
            </div>

            <div className="control-group action-group">
                <label className="hide-mobile">&nbsp;</label>
                <button onClick={handleSetAlert} className="action-btn blue">
                    🔔 Set Alert
                </button>
            </div>
          </div>

          <div className="stock-header-row">
             <h2 className="stock-title">{quote.name} ({quote.symbol})</h2>
             <button onClick={() => { setSymbol(null); setSearchParams({}); }} className="back-btn">← Back to Overview</button>
          </div>

          <StatsCards quote={quote} loading={loading} symbol={symbol} />
          
          <div className="dashboard-grid">
            <PriceChart history={history} prediction={prediction} symbol={symbol} loading={loading} /> 
            <PredictionCard prediction={prediction} loading={loading} quote={quote} />
          </div>

          <div className="company-profile">
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.4rem" }}>About {quote.name}</h3>
            <p style={{ lineHeight: "1.6", opacity: 0.8 }}>{quote.description}</p>
          </div>

          {news.length > 0 && (
            <div className="news-section">
              <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Latest News & Sentiment 📰</h3>
              <div className="news-grid">
                {news.map((item, index) => (
                  <div key={index} className="news-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span className="news-publisher">{item.publisher}</span>
                      <span className={`news-sentiment ${item.sentiment === "Positive" ? "positive" : "negative"}`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-title">{item.title}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // --- MARKET OVERVIEW ---
        <div className="market-home">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2 className="market-title">Market Today 🌏</h2>
            <span style={{color: '#22c55e', fontSize: '0.8rem', fontWeight:'bold'}}>● Live Updates</span>
          </div>
          
          <div className="indices-grid">
            {loading ? <div style={{color:'var(--text-muted)'}}>Loading Market Data...</div> : marketIndices.map((idx) => (
              <div key={idx.symbol} className="stat-card index-card" onClick={() => handleSearch(idx.symbol)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="stat-label">{idx.displayName}</div>
                  <div className={`stat-value ${idx.change >= 0 ? "positive" : "negative"}`} style={{ fontSize: '0.9rem' }}>{idx.change >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%</div>
                </div>
                <div className="stat-value" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{idx.symbol.includes("USD") ? "$" : "₹"}{idx.price.toLocaleString()}</div>
                <MiniChart data={idx.history} color={idx.change >= 0 ? "#4ade80" : "#f87171"} />
              </div>
            ))}
          </div>

          <h3 style={{ color: "var(--text-muted)", marginBottom: "15px", marginTop: "30px" }}>Trending Searches 🔥</h3>
          <div className="trending-chips">
            {["RELIANCE", "TCS", "TATAMOTORS", "HDFCBANK", "AAPL", "TSLA", "NVDA"].map((tick) => (
              <button 
                key={tick} 
                onClick={() => handleSearch(tick + (['AAPL', 'TSLA', 'NVDA'].includes(tick) ? '' : '.NS'))} 
                className="trending-chip"
              >
                {tick}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );    
}

export default Dashboard;