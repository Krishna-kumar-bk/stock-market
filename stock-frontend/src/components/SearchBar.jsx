import { useState, useEffect } from "react";
import "./SearchBar.css";

const SearchBar = ({ defaultSymbol, onSearch }) => {
  const [term, setTerm] = useState(defaultSymbol || "");

  // Update input text if the user clicks a "Trending Search" button in Dashboard
  useEffect(() => {
    setTerm(defaultSymbol || "");
  }, [defaultSymbol]);

  // --- THE FIX: Detect "Enter" Key ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch(term);
    }
  };

  return (
    <div className="search-bar-wrapper">
      <input
        type="text"
        className="search-input"
        placeholder="Enter stock symbol (e.g. RELIANCE.NS, TCS.NS)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={handleKeyDown} 
      />
      <button 
        className="search-btn"
        onClick={() => onSearch(term)}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;