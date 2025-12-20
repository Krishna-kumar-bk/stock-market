import React, { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Compare.css";

function Compare() {
  const [sym1, setSym1] = useState("");
  const [sym2, setSym2] = useState("");
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!sym1 || !sym2) {
      setError("Please enter both stock symbols.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      // 1. Fetch Comparison Data from Backend
      const res = await axios.get(`http://127.0.0.1:8000/api/stocks/compare?symbol1=${sym1}&symbol2=${sym2}`);
      setData(res.data);

      // 2. SMART DATA MERGING (Aligns dates perfectly)
      const s1Hist = res.data.stock1.history || [];
      const s2Hist = res.data.stock2.history || [];

      // Create a map of all unique dates
      const dateMap = new Map();

      // Add Stock 1 Data
      s1Hist.forEach((item) => {
        dateMap.set(item.date, { date: item.date, price1: item.price });
      });

      // Add Stock 2 Data (Merge into existing dates or create new ones)
      s2Hist.forEach((item) => {
        if (dateMap.has(item.date)) {
          const existing = dateMap.get(item.date);
          dateMap.set(item.date, { ...existing, price2: item.price });
        } else {
          dateMap.set(item.date, { date: item.date, price2: item.price });
        }
      });

      // Convert Map to Array & Sort by Date
      const merged = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setChartData(merged);
    } catch (err) {
      console.error(err);
      setError("Could not fetch data. Check symbols (e.g., TCS.NS, INFY.NS) and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => {
    if (!val) return "N/A";
    if (val > 1e12) return (val / 1e12).toFixed(2) + "T";
    if (val > 1e9) return (val / 1e9).toFixed(2) + "B";
    return val.toLocaleString();
  };

  // --- CUSTOM TOOLTIP FOR COMPARISON ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          padding: "12px",
          borderRadius: "8px",
          color: "white",
          minWidth: "150px"
        }}>
          <p style={{ margin: "0 0 8px 0", borderBottom: "1px solid #334155", paddingBottom: "5px", fontSize: "0.85rem", color: "#94a3b8" }}>
            📅 {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} style={{ marginBottom: "5px", color: entry.color, fontWeight: "bold" }}>
              {entry.name}: {entry.value?.toFixed(2)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="compare-container">
      <h1 className="page-title">Head-to-Head Comparison 🥊</h1>
      <p className="page-description">Pit two stocks against each other and see who wins.</p>

      {/* INPUTS */}
      <div className="compare-inputs">
        <input
          type="text"
          className="stock-input"
          placeholder="Stock A (e.g. TCS.NS)"
          value={sym1}
          onChange={(e) => setSym1(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
        />
        <span className="vs-badge">VS</span>
        <input
          type="text"
          className="stock-input"
          placeholder="Stock B (e.g. INFY.NS)"
          value={sym2}
          onChange={(e) => setSym2(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
        />
        <button 
          className="compare-btn"
          onClick={handleCompare} 
          disabled={loading}
        >
          {loading ? "Fighting..." : "Compare"}
        </button>
      </div>

      {error && <div className="error-msg" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid #ef4444" }}>{error}</div>}

      {data && (
        <div className="comparison-results" style={{ animation: "fadeIn 0.5s ease" }}>
          
          {/* WINNER BANNER */}
          <div className="winner-banner">
            🏆 The Winner is: <span className="winner-name">{data.winner === "Tie" ? "It's a Tie!" : data.winner}</span>
          </div>

          {/* --- DUAL LINE CHART --- */}
          <div className="chart-section" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "30px", border: "1px solid #334155" }}>
            <h3 style={{ color: "#94a3b8", marginBottom: "20px", textAlign: "left" }}>Performance History (6 Months) 📈</h3>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.5)" />
                  <XAxis dataKey="date" hide /> {/* Hiding dates to keep it clean, Tooltip shows it */}
                  <YAxis domain={['auto', 'auto']} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="price1" 
                    name={data.stock1.symbol} 
                    stroke="#f97316" // Orange
                    strokeWidth={3} 
                    dot={false} 
                    connectNulls 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price2" 
                    name={data.stock2.symbol} 
                    stroke="#3b82f6" // Blue
                    strokeWidth={3} 
                    dot={false} 
                    connectNulls 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- DATA TABLE --- */}
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className={data.winner === data.stock1.symbol ? "highlight" : ""}>{data.stock1.symbol}</th>
                <th className={data.winner === data.stock2.symbol ? "highlight" : ""}>{data.stock2.symbol}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Price</td>
                <td>₹{data.stock1.price.toFixed(2)}</td>
                <td>₹{data.stock2.price.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Change (1D)</td>
                <td style={{ color: data.stock1.change >= 0 ? "#22c55e" : "#ef4444" }}>
                  {data.stock1.changePercent.toFixed(2)}%
                </td>
                <td style={{ color: data.stock2.change >= 0 ? "#22c55e" : "#ef4444" }}>
                  {data.stock2.changePercent.toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td>Market Cap</td>
                <td>{formatMoney(data.stock1.marketCap)}</td>
                <td>{formatMoney(data.stock2.marketCap)}</td>
              </tr>
              <tr>
                <td>P/E Ratio</td>
                <td>{data.stock1.peRatio ? data.stock1.peRatio.toFixed(2) : "N/A"}</td>
                <td>{data.stock2.peRatio ? data.stock2.peRatio.toFixed(2) : "N/A"}</td>
              </tr>
              <tr>
                <td>EPS</td>
                <td>{data.stock1.eps ? data.stock1.eps.toFixed(2) : "N/A"}</td>
                <td>{data.stock2.eps ? data.stock2.eps.toFixed(2) : "N/A"}</td>
              </tr>
              <tr>
                <td>Beta (Volatility)</td>
                <td>{data.stock1.beta ? data.stock1.beta.toFixed(2) : "N/A"}</td>
                <td>{data.stock2.beta ? data.stock2.beta.toFixed(2) : "N/A"}</td>
              </tr>
              <tr>
                <td>Revenue</td>
                <td>{formatMoney(data.stock1.revenue)}</td>
                <td>{formatMoney(data.stock2.revenue)}</td>
              </tr>
              <tr>
                <td>Sector</td>
                <td>{data.stock1.sector}</td>
                <td>{data.stock2.sector}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Compare;