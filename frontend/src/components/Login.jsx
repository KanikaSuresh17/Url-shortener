import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (api.isAuthenticated()) {
      const storedUser = api.getCurrentUser();
      if (storedUser?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      setUser(data.user);
      if (data.user?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      if (err.status === 429) {
        setError('Too many login attempts. Please wait 15 minutes and try again.');
      } else if (err.status === 400 || err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative Fixed Shapes */}
      <div className="decor-bg-shape-1"></div>
      <div className="decor-bg-shape-2"></div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="auth-logo-header">
          <div className="auth-logo-icon-wrap">
            <Zap fill="#8bc34a" />
          </div>
          <span className="auth-logo-name">SnipURL</span>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to manage your links</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-container">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-container">
              <KeyRound className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className="input-eye-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing In…' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center' }}
            >
              {error}
            </motion.p>
          )}

          {/* Footer row: Forgot | Sign Up */}
          <div className="auth-footer-row">
            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
            <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
