import { useEffect, useState } from "react";
import { getWatchlist, removeFromWatchlist, fetchQuote } from "../services/api"; 
import { useNavigate } from "react-router-dom";
import "./Watchlist.css";

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));

  // Function to refresh stock prices
  const refreshPrices = useCallback(async () => {
    if (!user || !watchlist.length) return;
    
    try {
      const updatedItems = await Promise.all(watchlist.map(async (item) => {
        try {
          const quoteRes = await fetchQuote(item.symbol);
          const currentPrice = quoteRes.data.price;
          const currentValue = currentPrice * item.quantity;
          const investedValue = item.buy_price * item.quantity;
          const profit = currentValue - investedValue;
          const profitPercent = (profit / investedValue) * 100;
          return { ...item, currentPrice, profit, profitPercent, currentValue };
        } catch (error) {
          console.error(`Error updating price for ${item.symbol}:`, error);
          return item; // Return the item unchanged if there's an error
        }
      }));
      
      setWatchlist(updatedItems);
    } catch (err) {
      console.error("Error refreshing prices:", err);
    }
  }, [user, watchlist]);

  useEffect(() => {
    if (!user) {
      alert("Please login to view your portfolio.");
      navigate("/login");
      return;
    }
    
    // Initial load
    loadPortfolio();
    
    // Set up auto-refresh every 2 seconds
    const intervalId = setInterval(() => {
      refreshPrices();
    }, 2000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [user, navigate, refreshPrices]);

  const loadPortfolio = async () => {
    try {
      const res = await getWatchlist(user.id);
      const items = res.data;

      const updatedItems = await Promise.all(items.map(async (item) => {
        try {
            const quoteRes = await fetchQuote(item.symbol);
            const currentPrice = quoteRes.data.price;
            
            const currentValue = currentPrice * item.quantity;
            const investedValue = item.buy_price * item.quantity;
            const profit = currentValue - investedValue;
            const profitPercent = (profit / investedValue) * 100;

            return { ...item, currentPrice, profit, profitPercent, currentValue };
        } catch (error) {
            return { ...item, currentPrice: 0, profit: 0, profitPercent: 0, currentValue: 0 };
        }
      }));

      setWatchlist(updatedItems);
    } catch (err) {
      console.error("Error loading portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e, symbol) => {
    e.stopPropagation(); 
    if (window.confirm(`Remove ${symbol} from portfolio?`)) {
      try {
        await removeFromWatchlist(user.id, symbol);
        setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
      } catch (err) {
        alert("Failed to remove stock.");
      }
    }
  };

  const handleCardClick = (symbol) => {
    navigate(`/?symbol=${symbol}`);
  };

  const totalInvested = watchlist.reduce((acc, item) => acc + (item.buy_price * item.quantity), 0);
  const totalCurrent = watchlist.reduce((acc, item) => acc + (item.currentValue || 0), 0);
  const totalProfit = totalCurrent - totalInvested;

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
          <div>
            <h2 className="watchlist-title">My Portfolio 💼</h2>
            <p className="watchlist-subtitle">Track your investments in real-time</p>
          </div>
          
          {!loading && watchlist.length > 0 && (
              <div style={{ textAlign: 'right' }}>
                  <div className="watchlist-subtitle" style={{ fontSize: '0.9rem' }}>Total Profit/Loss</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="watchlist-invested">
                      Invested: <span>{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
              </div>
          )}
      </div>
      
      {loading ? (
        <div className="watchlist-loading">Loading your portfolio...</div>
      ) : watchlist.length === 0 ? (
        <div className="watchlist-empty">
          <p>Your portfolio is empty.</p>
          <button onClick={() => navigate("/")} className="add-btn">
            + Add First Stock
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => (
            <div 
              key={item.id} 
              className="stock-card" 
              onClick={() => handleCardClick(item.symbol)} 
            >
              <div className="stock-info" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                    <span className="stock-symbol">{item.symbol}</span>
                    <span className="stock-qty-badge">
                        Qty: {item.quantity}
                    </span>
                </div>
                <span className="stock-date">Avg Price: {item.buy_price}</span>
              </div>

              {/* REPLACED INLINE STYLE WITH CLASS */}
              <div className="stock-stats-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                    <span>Current</span>
                    <span>P/L</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stock-price">{item.currentPrice?.toFixed(2)}</span>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: item.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                            {item.profit >= 0 ? "+" : ""}{item.profit.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: item.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                            {item.profitPercent.toFixed(2)}%
                        </div>
                    </div>
                </div>
              </div>

              <div className="stock-actions">
                <button 
                  className="remove-btn"
                  onClick={(e) => handleRemove(e, item.symbol)}
                >
                  Sell / Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;