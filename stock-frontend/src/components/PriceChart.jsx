import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Brush,
  ReferenceArea,
} from "recharts";
import "./PriceChart.css";

// --- CANDLE SHAPE COMPONENT ---
const CandleStickShape = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#22c55e" : "#ef4444"; 

  const bodySize = Math.max(Math.abs(open - close), 0.00001); 
  const scale = height / bodySize;

  const highVal = high;
  const maxBody = Math.max(open, close);
  const wickTopLen = (highVal - maxBody) * scale;
  const wickTopY = y - wickTopLen; 

  const lowVal = low;
  const minBody = Math.min(open, close);
  const wickBottomLen = (minBody - lowVal) * scale;
  const wickBottomY = y + height + wickBottomLen; 

  const centerX = x + width / 2;

  return (
    <g>
      <line x1={centerX} y1={wickTopY} x2={centerX} y2={wickBottomY} stroke={color} strokeWidth={1.5} />
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 2)} 
        fill={isUp ? "#1e293b" : color} 
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  );
};

function PriceChart({ history = [], prediction, loading, symbol }) {
  const [chartType, setChartType] = useState("candlestick");
  
  // --- STATE FOR DATA ---
  const [originalData, setOriginalData] = useState([]); // Keeps full copy
  const [filteredData, setFilteredData] = useState([]); // What is actually shown
  
  // --- STATE FOR ZOOM SELECTION ---
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

  // 1. Initialize Data
  useEffect(() => {
    if (!history || history.length === 0) return;

    // Combine History + Prediction into one master array
    const masterData = history.map((h) => ({
      date: h.date,
      open: h.open || h.close,
      high: h.high || h.close,
      low: h.low || h.close,
      close: h.close,
      candleBody: [Math.min(h.open || h.close, h.close), Math.max(h.open || h.close, h.close)],
      predicted: undefined,
    }));

    // Add Prediction tail
    let lastPoint = masterData[masterData.length - 1];
    if (prediction?.series && lastPoint) {
       // Link history to prediction
       masterData.push({
         date: lastPoint.date,
         close: undefined,
         predicted: lastPoint.close,
         candleBody: undefined
       });
       
       prediction.series.forEach(p => {
         masterData.push({
           date: p.date,
           close: undefined,
           predicted: p.value,
           candleBody: undefined
         });
       });
    }

    setOriginalData(masterData);
    setFilteredData(masterData); // Show all initially
  }, [history, prediction]);


  // 2. ZOOM FUNCTION (The Slicing Logic)
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === "") {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    // Find indexes of the selection
    let leftIndex = originalData.findIndex(d => d.date === refAreaLeft);
    let rightIndex = originalData.findIndex(d => d.date === refAreaRight);

    // Handle user dragging backwards
    if (leftIndex > rightIndex) [leftIndex, rightIndex] = [rightIndex, leftIndex];

    // Safety check
    if (leftIndex < 0) leftIndex = 0;
    if (rightIndex < 0) rightIndex = originalData.length - 1;

    // CRITICAL: Slice the data array. The chart NOW ONLY SEES THIS SLICE.
    // This forces it to stay zoomed because the data physically doesn't exist in the view anymore.
    const newData = originalData.slice(leftIndex, rightIndex + 1);

    setFilteredData(newData);
    setRefAreaLeft("");
    setRefAreaRight("");
    setIsZoomed(true);
  };

  const zoomOut = () => {
    setFilteredData(originalData); // Restore full data
    setIsZoomed(false);
    setRefAreaLeft("");
    setRefAreaRight("");
  };

  const isDark = document.body.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "rgba(51, 65, 85, 0.5)" : "rgba(148, 163, 184, 0.2)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  // --- TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload.find(p => p.dataKey === "candleBody" || p.dataKey === "close");
      const predPoint = payload.find(p => p.dataKey === "predicted");
      if (!dataPoint && !predPoint) return null;

      const pData = dataPoint ? dataPoint.payload : {};
      
      return (
        <div className="custom-tooltip" style={{
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
            border: `1px solid ${gridColor}`,
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            minWidth: "180px"
        }}>
          <p style={{ color: textColor, margin: "0 0 8px 0", fontSize: "0.85rem", borderBottom: `1px solid ${gridColor}`, paddingBottom: "5px" }}>
            📅 {label}
          </p>
          {pData.close && (
             <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Close Price:</span><br/>
                <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: isDark ? "white" : "black" }}>
                   {pData.close.toFixed(2)}
                </span>
             </div>
          )}
          {pData.open && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 15px', fontSize: '0.85rem' }}>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>Open:</span><span style={{ color: "#22c55e", fontWeight: "600" }}>{pData.open.toFixed(2)}</span></div>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>High:</span><span style={{ color: "#eab308", fontWeight: "600" }}>{pData.high.toFixed(2)}</span></div>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>Low:</span><span style={{ color: "#ef4444", fontWeight: "600" }}>{pData.low.toFixed(2)}</span></div>
             </div>
          )}
          {predPoint && (
             <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #f97316" }}>
               <span style={{ color: "#f97316", fontSize: "0.8rem", fontWeight: "bold" }}>AI Prediction:</span>
               <div style={{ fontSize: "1rem", color: "#f97316", fontWeight: "bold" }}>{predPoint.value?.toFixed(2)}</div>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card" style={{ userSelect: 'none' }}> 
      <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="chart-title">
          {symbol ? `${symbol} Chart` : "Price Chart"}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* ZOOM RESET BUTTON: Visible when filteredData is smaller than originalData */}
            {isZoomed && (
                <button 
                    onClick={zoomOut}
                    style={{
                        background: "#ef4444", color: "white", border: "none",
                        padding: "6px 12px", borderRadius: "6px", cursor: "pointer", 
                        fontSize: "0.8rem", fontWeight: "bold",
                        display: "flex", alignItems: "center", gap: "5px",
                        animation: "fadeIn 0.3s ease"
                    }}
                >
                    Reset Zoom 🔍
                </button>
            )}

            <select 
                value={chartType} 
                onChange={(e) => setChartType(e.target.value)}
                style={{
                    background: isDark ? "#1e293b" : "#f1f5f9",
                    color: textColor,
                    border: `1px solid ${gridColor}`,
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer"
                }}
            >
                <option value="candlestick">Candlestick</option>
                <option value="line">Line Chart</option>
                <option value="step">Step Chart</option>
            </select>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">Loading chart data...</div>
      ) : filteredData.length === 0 ? (
        <div className="chart-empty">No chart data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart 
            data={filteredData} // <--- We pass the CUT data here
            onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e) => e && refAreaLeft && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.4} />
            
            <XAxis 
                dataKey="date" 
                tick={{ fill: textColor, fontSize: 11 }} 
                stroke={gridColor} 
                minTickGap={30}
            />
            
            <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fill: textColor, fontSize: 11 }} 
                stroke={gridColor} 
                width={60}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: textColor }} />

            {/* GRAPHS */}
            {chartType === 'candlestick' && (
               <Bar 
                 dataKey="candleBody" 
                 name="Price" 
                 shape={<CandleStickShape />} 
                 // Adjust bar size based on how much data is shown. If zoomed in, make bars fatter.
                 barSize={filteredData.length < 50 ? 20 : 10} 
                 isAnimationActive={false}
               >
                 {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? "#22c55e" : "#ef4444"} />
                 ))}
               </Bar>
            )}

            {chartType === 'line' && (
                <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Close Price" isAnimationActive={false} />
            )}
            
            {chartType === 'step' && (
                <Line type="step" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Close Price" isAnimationActive={false} />
            )}

            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#f97316" 
              strokeWidth={3} 
              strokeDasharray="5 5" 
              dot={false} 
              name="Predicted" 
              connectNulls={true} 
            />

            {/* VISUAL DRAG BOX */}
            {refAreaLeft && refAreaRight ? (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#8884d8" fillOpacity={0.3} />
            ) : null}

            {/* HIDE BRUSH IF ZOOMED to prevent conflicts */}
            {!isZoomed && (
                <Brush 
                    dataKey="date" 
                    height={30} 
                    stroke="#2563eb" 
                    fill={isDark ? "#1e293b" : "#f1f5f9"} 
                    tickFormatter={() => ""}
                />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PriceChart;