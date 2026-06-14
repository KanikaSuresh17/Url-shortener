import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { api } from './utils/api';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Check whether the stored JWT is expired
function isTokenExpired() {
  const token = localStorage.getItem('token');
  if (!token) return true;
  try {
    const { exp } = jwtDecode(token);
    // exp is in seconds; Date.now() is in milliseconds
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

// Inner component so we can use useNavigate inside the Router
function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  // Handle auth:logout event dispatched by api.js on 401
  const handleAuthLogout = useCallback(() => {
    setUser(null);
    api.logout();
    alert('Session expired. Please login again.');
    navigate('/login', { replace: true });
  }, [navigate, setUser]);

  useEffect(() => {
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [handleAuthLogout]);

  // Helper: require a valid, non-expired token
  function ProtectedRoute({ element, adminOnly = false }) {
    if (!localStorage.getItem('token') || isTokenExpired()) {
      // Clear stale data silently
      api.logout();
      return <Navigate to="/login" replace />;
    }
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
    return element;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Signup setUser={setUser} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute element={<Dashboard user={user} setUser={setUser} />} />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly element={<Admin user={user} setUser={setUser} />} />
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // On app load: check token validity before restoring session
    if (isTokenExpired()) {
      api.logout(); // wipe stale localStorage
    } else {
      const storedUser = api.getCurrentUser();
      if (storedUser) setUser(storedUser);
    }
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
