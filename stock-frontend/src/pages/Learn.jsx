import React, { useState } from "react";
import "./Learn.css";

// --- THE COURSE CONTENT DATABASE ---
// (Content kept exactly as you provided)
const courseData = [
  {
    id: "basics",
    title: "Module 1: Market Basics 🐣",
    lessons: [
      {
        title: "What is the Stock Market?",
        content: `
          <h3>The Supermarket of Companies</h3>
          <p>The stock market is essentially a marketplace where buyers and sellers meet to trade shares of publicly held companies. Think of it like a supermarket, but instead of buying groceries, you are buying small pieces of ownership in companies like Tata Motors, Reliance, or Apple.</p>
          <p><strong>Key Concepts:</strong></p>
          <ul>
            <li><strong>Share/Stock:</strong> A certificate of ownership in a company.</li>
            <li><strong>Exchange:</strong> The physical or digital place where trading happens (e.g., NSE, BSE, NYSE).</li>
            <li><strong>Broker:</strong> The middleman (like Zerodha or Groww) that connects you to the exchange.</li>
          </ul>
        `
      },
      {
        title: "IPO: Initial Public Offering",
        content: `
          <h3>Going Public</h3>
          <p>An IPO is when a private company decides to sell shares to the public for the first time. It's the "birth" of a stock on the market.</p>
          <div class="tip-box">💡 <strong>Why do companies do it?</strong> To raise money for expansion, pay off debt, or let early investors cash out.</div>
        `
      },
      {
        title: "Dividends & Corporate Action",
        content: `
          <h3>Getting Paid to Hold</h3>
          <p>When a company makes a profit, it can do two things: reinvest it into the business or share it with owners. That shared profit is called a <strong>Dividend</strong>.</p>
          <p>Other actions include:</p>
          <ul>
            <li><strong>Bonus Issue:</strong> Giving free extra shares to existing shareholders.</li>
            <li><strong>Stock Split:</strong> Breaking one expensive share into smaller, cheaper ones (e.g., 1 share of ₹1000 becomes 10 shares of ₹100).</li>
          </ul>
        `
      }
    ]
  },
  {
    id: "technical",
    title: "Module 2: Technical Analysis 📈",
    lessons: [
      {
        title: "Mastering Candlesticks",
        content: `
          <h3>The DNA of Price Action</h3>
          <p>Line charts only show the closing price. <strong>Candlestick charts</strong> show the full story: the battle between Buyers (Bulls) and Sellers (Bears) during a specific time.</p>
          
          <div class="candle-explanation-grid">
            <div class="candle-card">
              <h4>🟢 Bullish Candle (Green)</h4>
              <p>Price went <strong>UP</strong>.</p>
              <div class="candle-visual green-candle">
                <span class="label high">High</span>
                <span class="label close">Close</span>
                <div class="body"></div>
                <span class="label open">Open</span>
                <span class="label low">Low</span>
                <div class="wick"></div>
              </div>
              <p class="desc">The bottom of the body is where price <em>Opened</em>. The top is where it <em>Closed</em>. The wicks show the extreme High and Low.</p>
            </div>

            <div class="candle-card">
              <h4>🔴 Bearish Candle (Red)</h4>
              <p>Price went <strong>DOWN</strong>.</p>
              <div class="candle-visual red-candle">
                <span class="label high">High</span>
                <span class="label open">Open</span>
                <div class="body"></div>
                <span class="label close">Close</span>
                <span class="label low">Low</span>
                <div class="wick"></div>
              </div>
              <p class="desc">The top of the body is where price <em>Opened</em>. The bottom is where it <em>Closed</em>. Sellers won this round.</p>
            </div>
          </div>

          <h3>Why does it look like that?</h3>
          <ul>
            <li><strong>The Body:</strong> Shows the real move. A long green body means buyers were aggressive.</li>
            <li><strong>The Wicks (Shadows):</strong> Show rejection. A long upper wick means buyers tried to push it up, but sellers pushed it back down.</li>
          </ul>
        `
      },
      {
        title: "Candlestick Patterns",
        content: `
          <h3>Reading the Signals</h3>
          <p>When candles form specific shapes, they give us hints about the future.</p>
          
          <div class="pattern-grid">
            <div class="pattern-box">
              <strong>🔨 Hammer</strong>
              <p>Looks like a hammer. A small body with a long lower wick. Found at the bottom of a downtrend. <strong>Signal: Buy (Reversal)</strong></p>
            </div>
            <div class="pattern-box">
              <strong>☄️ Shooting Star</strong>
              <p>Looks like an inverted hammer. Long upper wick. Found at the top of an uptrend. <strong>Signal: Sell (Reversal)</strong></p>
            </div>
             <div class="pattern-box">
              <strong>🤰 Engulfing</strong>
              <p>A big green candle completely "eats" the previous small red candle. Shows massive power shift. <strong>Signal: Strong Buy</strong></p>
            </div>
          </div>
        `
      },
      {
        title: "Support & Resistance",
        content: `
          <h3>The Floor and The Ceiling</h3>
          <p>Prices rarely move in a straight line. They bounce between invisible levels.</p>
          <ul>
            <li><strong>Support (Floor):</strong> A price level where a stock struggles to fall below. Buyers step in here.</li>
            <li><strong>Resistance (Ceiling):</strong> A price level where a stock struggles to go above. Sellers step in here.</li>
          </ul>
          <p><em>Strategy:</em> Buy at Support, Sell at Resistance.</p>
        `
      },
      {
        title: "Indicators (RSI, MACD)",
        content: `
          <h3>Your Dashboard Instruments</h3>
          <p>Indicators are math formulas applied to price data to predict future moves.</p>
          <ul>
            <li><strong>RSI (Relative Strength Index):</strong> Measures speed. Above 70 = Overbought (Expensive), Below 30 = Oversold (Cheap).</li>
            <li><strong>Moving Averages (SMA/EMA):</strong> Smooths out price noise to show the true trend.</li>
          </ul>
        `
      }
    ]
  },
  {
    id: "fundamental",
    title: "Module 3: Fundamental Analysis 🏢",
    lessons: [
      {
        title: "Reading the P/E Ratio",
        content: `
          <h3>Price-to-Earnings Ratio</h3>
          <p>The most famous metric in investing. It tells you how much you are paying for ₹1 of the company's earnings.</p>
          <p><strong>Formula:</strong> Stock Price / Earnings Per Share (EPS)</p>
          <ul>
            <li><strong>High P/E:</strong> Investors expect high growth (e.g., Tech stocks).</li>
            <li><strong>Low P/E:</strong> The stock might be undervalued or the company is struggling.</li>
          </ul>
        `
      },
      {
        title: "Market Cap Categories",
        content: `
          <h3>Size Matters</h3>
          <ul>
            <li><strong>Large Cap:</strong> Huge, stable companies (Reliance, TCS). Safe but slow growth.</li>
            <li><strong>Mid Cap:</strong> Medium-sized. Higher risk, higher growth potential.</li>
            <li><strong>Small Cap:</strong> Risky, volatile, but can become the next giant.</li>
          </ul>
        `
      }
    ]
  },
  {
    id: "psychology",
    title: "Module 4: Trading Psychology 🧠",
    lessons: [
      {
        title: "FOMO & Greed",
        content: `
          <h3>Fear Of Missing Out</h3>
          <p>The biggest enemy of a trader is their own emotion. Buying a stock just because it's skyrocketing usually leads to buying at the top.</p>
          <div class="tip-box">🛑 <strong>Rule:</strong> Never chase a moving train. Wait for the next station (pullback).</div>
        `
      },
      {
        title: "Risk Management",
        content: `
          <h3>Protecting Your Capital</h3>
          <p>Professional traders don't focus on winning; they focus on NOT losing everything.</p>
          <ul>
            <li><strong>Stop Loss:</strong> An automatic exit order if the price drops too much.</li>
            <li><strong>Position Sizing:</strong> Never put more than 2-5% of your total money into a single risky trade.</li>
          </ul>
        `
      }
    ]
  }
];

function Learn() {
  const [activeModuleId, setActiveModuleId] = useState("basics");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const activeModule = courseData.find((m) => m.id === activeModuleId);
  const activeLesson = activeModule.lessons[activeLessonIndex];

  return (
    <div className="learn-wrapper">
      {/* SIDEBAR NAVIGATION */}
      <aside className="learn-sidebar">
        <div className="sidebar-header">
          <h2>🎓 Academy</h2>
          <p>A-Z Stock Mastery</p>
        </div>
        
        <div className="modules-list">
          {courseData.map((module) => (
            <div key={module.id} className="module-group">
              <div 
                className={`module-title ${activeModuleId === module.id ? "active" : ""}`}
                onClick={() => {
                  setActiveModuleId(module.id);
                  setActiveLessonIndex(0); // Reset to first lesson of new module
                }}
              >
                {module.title}
              </div>
              
              {/* Show lessons only if module is active */}
              {activeModuleId === module.id && (
                <div className="lesson-list">
                  {module.lessons.map((lesson, idx) => (
                    <button
                      key={idx}
                      className={`lesson-btn ${activeLessonIndex === idx ? "active-lesson" : ""}`}
                      onClick={() => setActiveLessonIndex(idx)}
                    >
                      {idx + 1}. {lesson.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="learn-content-area">
        <div className="content-header">
          <span className="breadcrumb">{activeModule.title} / Lesson {activeLessonIndex + 1}</span>
          <h1>{activeLesson.title}</h1>
        </div>
        
        <div 
          className="lesson-body"
          dangerouslySetInnerHTML={{ __html: activeLesson.content }} 
        />

        {/* Navigation Buttons */}
        <div className="lesson-footer">
            <button 
                disabled={activeLessonIndex === 0}
                onClick={() => setActiveLessonIndex(prev => prev - 1)}
                className="nav-btn"
            >
                ← Previous
            </button>
            <button 
                disabled={activeLessonIndex === activeModule.lessons.length - 1}
                onClick={() => setActiveLessonIndex(prev => prev + 1)}
                className="nav-btn primary"
            >
                Next Lesson →
            </button>
        </div>
      </main>
    </div>
  );
}

export default Learn;