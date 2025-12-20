import React, { useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from "recharts";

const CandleChart = ({ history, symbol }) => {
  // Toggle States
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  
  // --- NEW: Chart Type State ---
  const [chartType, setChartType] = useState("area"); // Options: area, line, bar, step

  if (!history || history.length === 0) {
    return (
      <div className="chart-container" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading Chart...
      </div>
    );
  }

  // Helper to render the correct main chart component
  const renderMainChart = () => {
    switch (chartType) {
      case "line":
        return (
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="close" 
            stroke="#22c55e" 
            strokeWidth={3} 
            dot={false} 
            name="Price"
          />
        );
      case "step":
        return (
          <Line 
            yAxisId="left"
            type="step" 
            dataKey="close" 
            stroke="#22c55e" 
            strokeWidth={3} 
            dot={false} 
            name="Price"
          />
        );
      case "bar":
        return (
          <Bar 
            yAxisId="left"
            dataKey="close" 
            fill="#22c55e" 
            name="Price"
          />
        );
      case "area":
      default:
        return (
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="close" 
            stroke="#22c55e" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            name="Price"
          />
        );
    }
  };

  return (
    <div className="chart-card" style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
      
      {/* --- CHART TOOLBAR --- */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", gap: "10px" }}>
        
        {/* Left: Title & Dropdown */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: "white" }}>{symbol} Chart 📊</h3>
          
          {/* CHART TYPE SELECTOR */}
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
            style={{
              background: "#0f172a",
              color: "white",
              border: "1px solid #334155",
              padding: "5px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            <option value="area">Area Chart</option>
            <option value="line">Line Chart</option>
            <option value="step">Step Line</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
        
        {/* Right: Toggles */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setShowSMA20(!showSMA20)}
            style={{ 
              padding: "5px 10px", 
              borderRadius: "4px", 
              border: "1px solid #eab308", 
              background: showSMA20 ? "#eab308" : "transparent", 
              color: showSMA20 ? "black" : "#eab308",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold"
            }}
          >
            SMA 20
          </button>

          <button 
            onClick={() => setShowSMA50(!showSMA50)}
            style={{ 
              padding: "5px 10px", 
              borderRadius: "4px", 
              border: "1px solid #3b82f6", 
              background: showSMA50 ? "#3b82f6" : "transparent", 
              color: showSMA50 ? "white" : "#3b82f6",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold"
            }}
          >
            SMA 50
          </button>

          <button 
            onClick={() => setShowVolume(!showVolume)}
            style={{ 
              padding: "5px 10px", 
              borderRadius: "4px", 
              border: "1px solid #94a3b8", 
              background: showVolume ? "#94a3b8" : "transparent", 
              color: showVolume ? "black" : "#94a3b8",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold"
            }}
          >
            Volume
          </button>
        </div>
      </div>

      {/* --- THE CHART --- */}
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart data={history}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: "#94a3b8", fontSize: 12 }} 
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left" 
              domain={['auto', 'auto']} 
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={false} 
              axisLine={false} 
              domain={[0, 'dataMax * 3']} 
            />

            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "white" }} 
              itemStyle={{ color: "#cbd5e1" }}
            />
            <Legend />

            {/* Volume Bars (Always there if toggled) */}
            {showVolume && (
              <Bar 
                yAxisId="right" 
                dataKey="volume" 
                fill="#6366f1" 
                opacity={0.3} 
                name="Volume" 
                barSize={5}
              />
            )}

            {/* SMA Lines (Always overlay if toggled) */}
            {showSMA20 && (
              <Line yAxisId="left" type="monotone" dataKey="sma20" stroke="#eab308" strokeWidth={2} dot={false} name="SMA 20" />
            )}
            {showSMA50 && (
              <Line yAxisId="left" type="monotone" dataKey="sma50" stroke="#3b82f6" strokeWidth={2} dot={false} name="SMA 50" />
            )}

            {/* DYNAMIC MAIN CHART (Area, Line, Step, or Bar) */}
            {renderMainChart()}

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CandleChart;