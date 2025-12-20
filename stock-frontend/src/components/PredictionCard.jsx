import React from "react";

const PredictionCard = ({ prediction, loading, quote }) => {
  if (loading) return <div className="prediction-card loading">Analyzing data...</div>;
  if (!prediction) return null;

  const sym = quote?.symbol || "";
  const isINR = sym.includes(".NS") || sym.includes(".BO") || sym === "^NSEI" || sym === "^BSESN";
  const currency = isINR ? "₹" : "$";

  // Helper to calculate % change for forecasts
  const getChange = (targetPrice) => {
    if (!quote?.price) return 0;
    return ((targetPrice - quote.price) / quote.price) * 100;
  };

  const verdictColor = prediction.verdict.includes("BUY") ? "#22c55e" : 
                       prediction.verdict.includes("SELL") ? "#ef4444" : "#eab308";

  return (
    <div className="prediction-card" style={{ background: "#0f172a", padding: "0", borderRadius: "16px", border: "1px solid #1e293b", overflow: 'hidden' }}>
      
      {/* HEADER: AI Verdict */}
      <div style={{ background: verdictColor, padding: "20px", textAlign: "center" }}>
        <h4 style={{ margin: 0, color: "white", opacity: 0.9, fontSize: "0.9rem", letterSpacing: "1px" }}>AI RECOMMENDATION</h4>
        <h1 style={{ margin: "5px 0 0 0", color: "white", fontSize: "2rem", fontWeight: "900" }}>{prediction.verdict}</h1>
        <p style={{ margin: "5px 0 0 0", color: "white", fontSize: "0.9rem", fontWeight: "500" }}>
          "{prediction.reason}"
        </p>
      </div>

      <div style={{ padding: "25px" }}>
        
        {/* Short Term Prediction */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #334155", paddingBottom: "15px" }}>
          <span style={{ color: "#94a3b8" }}>Tomorrow's Target</span>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "white" }}>
            {currency}{prediction.nextClose.toFixed(2)}
          </span>
        </div>

        {/* --- NEW: Long Term Forecast Grid --- */}
        <h4 style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "10px", textTransform: "uppercase" }}>Long Term Forecast 📅</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            
            {/* 1 Month */}
            <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>1 Month</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>
                    {currency}{prediction.longTerm["1mo"].toFixed(0)}
                </div>
                <div style={{ fontSize: "0.7rem", color: getChange(prediction.longTerm["1mo"]) >= 0 ? "#22c55e" : "#ef4444" }}>
                    {getChange(prediction.longTerm["1mo"]) >= 0 ? "+" : ""}{getChange(prediction.longTerm["1mo"]).toFixed(1)}%
                </div>
            </div>

            {/* 6 Months */}
            <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>6 Months</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>
                    {currency}{prediction.longTerm["6mo"].toFixed(0)}
                </div>
                <div style={{ fontSize: "0.7rem", color: getChange(prediction.longTerm["6mo"]) >= 0 ? "#22c55e" : "#ef4444" }}>
                    {getChange(prediction.longTerm["6mo"]) >= 0 ? "+" : ""}{getChange(prediction.longTerm["6mo"]).toFixed(1)}%
                </div>
            </div>

            {/* 1 Year */}
            <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>1 Year</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>
                    {currency}{prediction.longTerm["1y"].toFixed(0)}
                </div>
                <div style={{ fontSize: "0.7rem", color: getChange(prediction.longTerm["1y"]) >= 0 ? "#22c55e" : "#ef4444" }}>
                    {getChange(prediction.longTerm["1y"]) >= 0 ? "+" : ""}{getChange(prediction.longTerm["1y"]).toFixed(1)}%
                </div>
            </div>

        </div>

     {/* Technical Indicators Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>RSI Score</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: prediction.rsi > 70 ? "#ef4444" : prediction.rsi < 30 ? "#22c55e" : "white" }}>
              {prediction.rsi}
            </div>
          </div>
          <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Trend</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: prediction.trend === "Bullish" ? "#22c55e" : "#ef4444" }}>
              {prediction.trend}
            </div>
          </div>
        </div>

        {/* AI Confidence Meter (NEW) */}
        {prediction.confidence && (
            <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>AI Confidence Level</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>{prediction.confidence}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#334155", borderRadius: "3px" }}>
                    <div style={{ 
                        width: `${prediction.confidence}%`, 
                        height: "100%", 
                        background: prediction.confidence > 80 ? "#22c55e" : prediction.confidence > 50 ? "#eab308" : "#ef4444",
                        borderRadius: "3px",
                        transition: "width 1s ease"
                    }}></div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PredictionCard;