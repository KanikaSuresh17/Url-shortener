import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Navbar from './Navbar';
import AnalyticsPanel from './AnalyticsView';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Link2, Plus, Copy, Check, BarChart2, Trash2, 
  ExternalLink, Calendar, HelpCircle, ChevronDown 
} from 'lucide-react';

export default function Dashboard({ user, setUser }) {
  const [urls, setUrls] = useState([]);
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [activeAnalyticsId, setActiveAnalyticsId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    async function fetchUrls() {
      try {
        setLoading(true);
        const data = await api.getUrls();
        setUrls(data);
      } catch (err) {
        setError('Failed to load your shortened URLs.');
      } finally {
        setLoading(false);
      }
    }

    fetchUrls();
  }, [navigate]);

  useEffect(() => {
    // Connect to Socket.io backend
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

    socket.on('click_update', (data) => {
      // Find matching row, update clicks value, and trigger a brief flash highlight
      setUrls((prevUrls) => {
        const index = prevUrls.findIndex(
          (u) => u.id === data.urlId || u.shortCode === data.shortCode
        );
        if (index !== -1) {
          // Trigger visual flash
          setHighlightedId(data.urlId);
          setTimeout(() => setHighlightedId(null), 1000);

          const updated = [...prevUrls];
          updated[index] = { 
            ...updated[index], 
            clicks: data.clicks, 
            lastVisited: new Date().toISOString() 
          };
          return updated;
        }
        return prevUrls;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const validateUrl = (url) => {
    if (!url) return false;
    let testUrl = url;
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = 'http://' + testUrl;
    }
    try {
      const parsed = new URL(testUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!longUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(longUrl)) {
      setError('Please enter a valid HTTP/HTTPS URL (e.g. google.com or https://example.com)');
      return;
    }

    setSubmitting(true);
    try {
      const newUrl = await api.createUrl(longUrl.trim());
      setUrls((prev) => [newUrl, ...prev]);
      setLongUrl('');
      setSuccessMsg('URL shortened successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortened URL? All visit history analytics will be permanently lost.')) {
      return;
    }

    try {
      await api.deleteUrl(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
      if (activeAnalyticsId === id) {
        setActiveAnalyticsId(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete URL');
    }
  };

  const handleCopy = (id, shortCode) => {
    const urlObj = urls.find((u) => u.id === id);
    const fullShortUrl = urlObj?.shortUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/s/${shortCode}`;
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      alert('Failed to copy to clipboard.');
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatLastVisited = (isoString) => {
    if (!isoString) return 'Never visited';
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} at ${timePart}`;
  };

  return (
    <div className="app-layout">
      <Navbar user={user} setUser={setUser} />
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Link Dashboard</h1>
          <p className="dashboard-subtitle">Create unique, trackable short links and monitor real-time analytics.</p>
        </div>

        {/* Shorten Input Form Card */}
        <section className="shortener-card">
          <form onSubmit={handleSubmit} className="shortener-form">
            <div className="form-group">
              <label className="form-label" htmlFor="longUrl">Shorten a long URL</label>
              <div className="input-container">
                <Link2 className="input-icon" />
                <input
                  id="longUrl"
                  type="text"
                  className="form-input"
                  placeholder="Paste your long link here (e.g. google.com or https://example.com)..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-shorten" disabled={submitting}>
              {submitting ? 'Shortening...' : 'Shorten'}
              {!submitting && <Plus size={18} />}
            </button>
          </form>

          {/* Validation & Alert Feedbacks */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="alert alert-danger" 
                style={{ marginTop: '20px', marginBottom: '0' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                className="alert alert-success" 
                style={{ marginTop: '20px', marginBottom: '0' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Links List Section */}
        <section className="links-section">
          <div className="links-section-header">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Your Shortened URLs</h3>
            <span className="links-count">{urls.length} Link{urls.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="loading-container" style={{ minHeight: '200px' }}>
              <div className="spinner"></div>
            </div>
          ) : urls.length === 0 ? (
            <div className="empty-state">
              <HelpCircle className="empty-icon" />
              <h3>No links created yet</h3>
              <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                Enter a long URL above and click "Shorten" to create your first link.
              </p>
            </div>
          ) : (
            <div className="links-grid">
              <AnimatePresence>
                {urls.map((url) => (
                  <motion.div 
                    key={url.id} 
                    className={`link-card ${highlightedId === url.id ? 'flash-highlight' : ''}`}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    {/* Shortened and Original URLs */}
                    <div className="url-info">
                      <a 
                        href={url.shortUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/s/${url.shortCode}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="short-url-link"
                      >
                        {url.shortUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/s/${url.shortCode}`}
                        <ExternalLink size={14} style={{ opacity: 0.6 }} />
                      </a>
                      <span className="long-url" title={url.originalUrl}>
                        {url.originalUrl}
                      </span>
                    </div>

                    {/* Date Created */}
                    <div className="link-stat">
                      <span className="stat-label">Created</span>
                      <span className="stat-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {formatDate(url.createdAt)}
                      </span>
                    </div>

                    {/* Total Clicks */}
                    <div className="link-stat">
                      <span className="stat-label">Total Clicks</span>
                      <span className="stat-value clicks">{url.clicks || 0}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        {url.clicks > 0 && url.lastVisited
                          ? `Last visited: ${formatLastVisited(url.lastVisited)}`
                          : 'Never visited'}
                      </span>
                    </div>

                    {/* Analytics Toggle Button */}
                    <div className="link-stat">
                      <span className="stat-label">Performance</span>
                      <button 
                        onClick={() => setActiveAnalyticsId(activeAnalyticsId === url.id ? null : url.id)}
                        className="btn-logout" 
                        style={{ 
                          border: '1px solid rgba(168, 85, 247, 0.2)', 
                          color: 'var(--secondary)', 
                          display: 'inline-flex', 
                          gap: '4px', 
                          width: 'fit-content',
                          background: activeAnalyticsId === url.id ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                        }}
                      >
                        <BarChart2 size={13} />
                        <span>{activeAnalyticsId === url.id ? 'Collapse' : 'Analytics'}</span>
                        <ChevronDown 
                          size={13} 
                          style={{ 
                            transition: 'transform 0.25s ease',
                            transform: activeAnalyticsId === url.id ? 'rotate(180deg)' : 'rotate(0deg)'
                          }} 
                        />
                      </button>
                    </div>

                    {/* Actions: Copy & Delete */}
                    <div className="link-actions">
                      <button 
                        className="action-btn" 
                        onClick={() => handleCopy(url.id, url.shortCode)}
                        title="Copy short link"
                      >
                        {copiedId === url.id ? <Check size={18} style={{ color: 'var(--accent)' }} /> : <Copy size={18} />}
                      </button>
                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => handleDelete(url.id)}
                        title="Delete URL"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Inline Analytics Panel */}
                    <div 
                      className="analytics-expand-wrapper"
                      style={{
                        maxHeight: activeAnalyticsId === url.id ? '800px' : '0px',
                        opacity: activeAnalyticsId === url.id ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        pointerEvents: activeAnalyticsId === url.id ? 'auto' : 'none',
                      }}
                    >
                      {activeAnalyticsId === url.id && (
                        <AnalyticsPanel urlId={url.id} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>



      {/* Persistent Copied success Toast overlay */}
      <AnimatePresence>
        {copiedId && (
          <motion.div 
            className="toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            Copied short URL to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
