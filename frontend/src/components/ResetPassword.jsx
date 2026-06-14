import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff, Link2, ArrowRight } from 'lucide-react';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL || ''}/api`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Token is missing.');
    }
  }, [token]);

  const validate = () => {
    if (!password || !confirmPassword) return 'Please fill in all fields';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    const specialCharRegex = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(password)) return 'Password must contain at least one special character (!@#$%^&*Expanded)';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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

        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Create a secure new password for your account</p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-message">
              ✓ Password reset successfully! Redirecting you to Login page...
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <div className="input-container">
                <KeyRound className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="New strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
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
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-container">
                <KeyRound className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
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

            <button
              id="reset-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !token}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
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
              <Link to="/login" className="auth-link">← Return to Login</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
