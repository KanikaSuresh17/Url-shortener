import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowRight, Eye, EyeOff, Link2, User } from 'lucide-react';

export default function Signup({ setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const validate = () => {
    if (!email.trim() || !password || !confirmPassword) return 'Please fill in all required fields';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    const specialCharRegex = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const data = await api.register(email.trim(), password, username.trim() || undefined);
      setUser(data.user);
      if (data.user?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign up. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="auth-logo-header">
          <div className="auth-logo-icon-wrap">
            <Link2 />
          </div>
          <span className="auth-logo-name">SnipURL</span>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start shortening links in seconds</p>

        {error && (
          <motion.div
            className="alert alert-danger"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username (optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <div className="input-container">
              <User className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Choose a display name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email <span style={{ color: '#ef4444' }}>*</span></label>
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
            <label className="form-label" htmlFor="password">Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-container">
              <KeyRound className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
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
            <p className="password-hint">Min 8 characters with at least one special character (!@#$%^&*)</p>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-container">
              <KeyRound className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className="input-eye-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="signup-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Account…' : 'Get Started'}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Footer */}
          <p className="auth-footer" style={{ marginTop: '16px' }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
