import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Link2 } from 'lucide-react';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success — backend returns same message either way
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        style={{ maxWidth: '400px' }}
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

        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">Enter your email and we'll send a reset link</p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-message">
              ✓ If this email exists, a reset link has been sent. Check your inbox.
            </div>
            <p className="auth-footer">
              <Link to="/login" className="auth-link">← Back to Sign In</Link>
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
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

            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
              {!loading && <ArrowRight size={16} />}
            </button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center' }}
              >
                {error}
              </motion.p>
            )}

            <p className="auth-footer" style={{ marginTop: '16px' }}>
              <Link to="/login" className="auth-link">← Back to Sign In</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
