import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Login from "./pages/Login";
import Learn from "./pages/Learn";
import Compare from "./pages/Compare";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Fragment } from 'react';
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Fragment>
          <Routes>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/watchlist" element={<Layout><Watchlist /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/learn" element={<Layout><Learn /></Layout>} />
            <Route path="/compare" element={<Layout><Compare /></Layout>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          <ToastContainer position="top-center" autoClose={5000} />
        </Fragment>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;