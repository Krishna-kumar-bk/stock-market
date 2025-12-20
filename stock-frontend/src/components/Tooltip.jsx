import React, { useState } from "react";

const Tooltip = ({ text, info }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      style={{ position: "relative", display: "inline-block", cursor: "help" }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span style={{ borderBottom: "1px dashed #94a3b8", color: "#64748b", fontWeight: "bold" }}>
        {text} ⓘ
      </span>
      
      {isVisible && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#334155",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          width: "200px",
          fontSize: "0.8rem",
          fontWeight: "normal",
          zIndex: 100,
          marginBottom: "10px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          textAlign: "center"
        }}>
          {info}
          {/* Little arrow pointing down */}
          <div style={{ 
            position: "absolute", 
            top: "100%", 
            left: "50%", 
            marginLeft: "-5px", 
            borderWidth: "5px", 
            borderStyle: "solid", 
            borderColor: "#334155 transparent transparent transparent" 
          }}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;