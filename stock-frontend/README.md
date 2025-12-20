# AI Stock Market Dashboard

A modern, professional stock market dashboard built with React and Vite. Features real-time stock tracking, AI predictions, watchlist management, and a beautiful dark/light theme system.

## ✨ Features

- **📊 Stock Dashboard**: View real-time stock quotes, price charts, and AI predictions
- **🌓 Dark/Light Theme**: Professional theme switcher with smooth transitions
- **📈 Interactive Charts**: Price history visualization with prediction overlays
- **⭐ Watchlist**: Add and manage your favorite stocks
- **🔍 Smart Search**: Quick stock symbol lookup
- **📱 Responsive Design**: Works beautifully on desktop and mobile devices
- **🎨 Modern UI**: Clean, professional design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation & Running

1. **Navigate to the project directory:**
   ```bash
   cd stock-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The app will automatically open at `http://localhost:5173`
   - If it doesn't, manually navigate to that URL

### Build for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
stock-frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.jsx   # Main layout with navigation & theme toggle
│   │   ├── SearchBar.jsx
│   │   ├── StatsCards.jsx
│   │   ├── PriceChart.jsx
│   │   └── PredictionCard.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Watchlist.jsx
│   │   └── Login.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
└── package.json
```

## 🎨 Theme System

The app includes a professional dark/light theme system:

- **Light Theme**: Clean, bright interface perfect for daytime use
- **Dark Theme**: Easy on the eyes for night-time trading
- **Auto-save**: Your theme preference is saved in localStorage
- **Toggle**: Click the theme button in the header to switch themes

## 🔌 Backend Integration

The frontend is configured to connect to a backend API at `http://localhost:8000/api`. 

**Note**: If the backend is not running, you'll see a friendly error message. The UI will still work perfectly for testing and development.

### API Endpoints Expected:

- `GET /api/stocks/quote?symbol=AAPL` - Get stock quote
- `GET /api/stocks/history?symbol=AAPL&range=6mo` - Get price history
- `GET /api/stocks/predict?symbol=AAPL` - Get AI prediction

## 🛠️ Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Chart visualization
- **Axios** - HTTP client
- **CSS3** - Styling with modern features

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Usage Tips

1. **Search Stocks**: Type a stock symbol (e.g., AAPL, TSLA, MSFT) in the search bar
2. **Toggle Theme**: Click the moon/sun icon in the header
3. **View Watchlist**: Navigate to the Watchlist page to manage your stocks
4. **View Charts**: See price history and AI predictions on the Dashboard

## 🐛 Troubleshooting

**Port already in use?**
- Change the port in `vite.config.js` or kill the process using port 5173

**Dependencies not installing?**
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

**Backend connection errors?**
- This is normal if the backend isn't running. The UI will still work for frontend testing.

## 📄 License

This project is part of the stock-market application.
