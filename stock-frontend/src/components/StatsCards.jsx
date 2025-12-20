import React from "react";

const StatsCards = ({ quote, loading, symbol }) => {
  if (loading) return <div className="stats-container"><div className="card loading">Loading...</div></div>;
  if (!quote) return null;

  const isINR = symbol?.includes(".NS") || symbol?.includes(".BO") || symbol === "^NSEI" || symbol === "^BSESN";
  const currency = isINR ? "₹" : "$";
  const isPositive = quote.change >= 0;

  // Check if we actually have valid fundamental data
  const hasFundamentals = quote.revenue > 0 || quote.netIncome > 0 || quote.eps > 0;

  const formatBigNumber = (num) => {
    if (!num || num === 0) return "N/A";
    if (num >= 1.0e+12) return (num / 1.0e+12).toFixed(2) + "T";
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + "B";
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + "M";
    return num.toLocaleString();
  };

  return (
    <div className="stats-wrapper">
      {/* ROW 1: PRICE & VOLUME (Always Visible) */}
      <div className="stats-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        
        <div className="stat-card" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "5px" }}>SYMBOL</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>{quote.symbol}</div>
        </div>

        <div className="stat-card" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "5px" }}>PRICE</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>
            {currency}{quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "5px" }}>CHANGE</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: isPositive ? "#22c55e" : "#ef4444" }}>
            {isPositive ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
          </div>
        </div>

        <div className="stat-card" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "5px" }}>VOLUME</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>
            {formatBigNumber(quote.volume)}
          </div>
        </div>
      </div>

      {/* ROW 2: FUNDAMENTALS (ONLY SHOW IF DATA EXISTS) */}
      {hasFundamentals && (
        <>
            <h4 style={{ color: "#94a3b8", margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1px" }}>Fundamentals</h4>
            <div className="fundamentals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "30px" }}>
                
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Revenue (TTM)</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#cbd5e1" }}>
                        {currency}{formatBigNumber(quote.revenue)}
                    </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Net Profit</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: quote.netIncome > 0 ? "#22c55e" : "#ef4444" }}>
                        {currency}{formatBigNumber(quote.netIncome)}
                    </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>EPS</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#cbd5e1" }}>
                        {quote.eps ? quote.eps.toFixed(2) : "N/A"}
                    </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Div Yield</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#eab308" }}>
                        {quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) + "%" : "0%"}
                    </div>
                </div>

            </div>
        </>
      )}
    </div>
  );
};

export default StatsCards;