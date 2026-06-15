import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import AnalyticsPanel from './AnalyticsView';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Link2, Plus, Copy, Check, BarChart2, Trash2, Pencil,
  ExternalLink, Calendar, HelpCircle, ChevronDown, QrCode, Download,
  Zap, Crown, LayoutDashboard, Globe, Users, Settings, CreditCard, LogOut, Shield, TrendingUp, Award, Activity
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
  const [activeQrId, setActiveQrId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const qrRefs = useRef({});
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

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
    const socket = io(import.meta.env.VITE_BACKEND_URL);

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
    const fullShortUrl = urlObj?.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${shortCode}`;
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      alert('Failed to copy to clipboard.');
    });
  };

  const handleEditClick = (url) => {
    if (editingId === url.id) {
      setEditingId(null);
    } else {
      setEditingId(url.id);
      setEditValue(url.originalUrl);
      setEditError('');
      setActiveAnalyticsId(null);
      setActiveQrId(null);
    }
  };

  const handleSaveEdit = async (e, id) => {
    e.preventDefault();
    setEditError('');

    if (!editValue.trim()) {
      setEditError('Please enter a URL');
      return;
    }

    if (!validateUrl(editValue)) {
      setEditError('Please enter a valid HTTP/HTTPS URL (e.g. google.com or https://example.com)');
      return;
    }

    setEditSubmitting(true);
    try {
      const updatedUrl = await api.updateUrl(id, editValue.trim());
      setUrls((prev) =>
        prev.map((u) => (u.id === id ? { ...u, originalUrl: updatedUrl.originalUrl } : u))
      );
      setEditingId(null);
      setSuccessMsg('Destination URL updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setEditError(err.message || 'Failed to update URL');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/login');
  };

  const handleTabClick = (tabName) => {
    if (tabName === 'Logout') {
      handleLogout();
      return;
    }
    setActiveTab(tabName);
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
    <div className="dashboard-container">
      {/* Decorative Fixed Shapes */}
      <div className="decor-bg-shape-1"></div>
      <div className="decor-bg-shape-2"></div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <Zap className="logo-icon-green" size={24} fill="#8bc34a" />
            <span>MagicURL</span>
          </div>

          <nav className="sidebar-nav">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'My Links', icon: Link2 },
              { name: 'Analytics', icon: BarChart2 },
              { name: 'Domains', icon: Globe },
              { name: 'Teams', icon: Users },
              { name: 'Settings', icon: Settings },
              { name: 'Billing', icon: CreditCard },
              { name: 'Logout', icon: LogOut },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.name}
                  className={`sidebar-nav-item ${activeTab === item.name ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <IconComp size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Upgrade to Pro Card */}
        <div className="upgrade-pro-card">
          <Crown className="logo-icon-green" size={22} fill="#8bc34a" style={{ marginBottom: '4px' }} />
          <h4>Upgrade to Pro</h4>
          <p>Get unlimited links & premium stats</p>
          <button className="upgrade-btn" onClick={() => setActiveTab('Billing')}>Upgrade</button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="top-header">
          {/* Decorative Triangles in top right of top header */}
          <div className="decor-triangle-header"></div>

          <div className="header-left">
            {user && (
              <div className="user-email-pill">
                <Users size={14} style={{ color: 'var(--primary)' }} />
                <span>{user.email}</span>
              </div>
            )}
            {user?.role === 'admin' && (
              <button
                className="user-email-pill"
                onClick={() => navigate('/admin')}
                style={{ marginLeft: '12px', cursor: 'pointer', border: '1px solid var(--primary)', background: 'rgba(139, 195, 74, 0.1)' }}
              >
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Admin Panel</span>
              </button>
            )}
          </div>

          <div className="header-right">
            <button className="btn-logout-dark" onClick={handleLogout}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="dashboard-content" style={{ zIndex: 10 }}>
          {activeTab === 'Dashboard' && (
            <>
              {/* Header text */}
              <div className="dashboard-header">
                <h1 className="dashboard-title">Link Dashboard</h1>
                <p className="dashboard-subtitle">Create unique, trackable short links and monitor real-time analytics.</p>
              </div>

              {/* Stats Cards (4 in a row) */}
              <section className="stats-grid-four">
                <div className="stat-card-white">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Total Links</span>
                    <div className="stat-icon-square green">
                      <Link2 size={20} />
                    </div>
                  </div>
                  <span className="stat-card-value">{loading ? '...' : urls.length}</span>
                  <span className="stat-card-trend"><TrendingUp size={12} /> +12.5% this month</span>
                </div>

                <div className="stat-card-white">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Total Clicks</span>
                    <div className="stat-icon-square teal">
                      <BarChart2 size={20} />
                    </div>
                  </div>
                  <span className="stat-card-value">
                    {loading ? '...' : urls.reduce((sum, u) => sum + (u.clicks || 0), 0)}
                  </span>
                  <span className="stat-card-trend"><TrendingUp size={12} /> +8.2% this week</span>
                </div>

                <div className="stat-card-white">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Active Links</span>
                    <div className="stat-icon-square blue">
                      <Activity size={20} />
                    </div>
                  </div>
                  <span className="stat-card-value">
                    {loading ? '...' : urls.filter((u) => (u.clicks || 0) > 0).length}
                  </span>
                  <span className="stat-card-trend"><TrendingUp size={12} /> +4.7% today</span>
                </div>

                <div className="stat-card-white">
                  <div className="stat-card-header">
                    <span className="stat-card-title">Top Performance</span>
                    <div className="stat-icon-square gray">
                      <Award size={20} />
                    </div>
                  </div>
                  <span className="stat-card-value">
                    {loading ? '...' : urls.length > 0 ? Math.max(...urls.map((u) => u.clicks || 0)) : 0}
                  </span>
                  <span className="stat-card-trend"><TrendingUp size={12} /> Max click count</span>
                </div>
              </section>

              {/* Shorten URL Section with left accent border */}
              <section className="shortener-card-accent">
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
                  <button type="submit" className="btn btn-gradient-shorten btn-shorten" disabled={submitting} style={{ height: '52px' }}>
                    {submitting ? 'Shortening...' : 'Shorten'}
                    {!submitting && <Plus size={18} />}
                  </button>
                </form>

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

              {/* Links Grid rendering rows */}
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
                      {urls.map((url, index) => {
                        // alternating green, teal, blue
                        const colorClass = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'teal' : 'blue';
                        return (
                          <motion.div
                            key={url.id}
                            className={`link-row-card ${highlightedId === url.id ? 'flash-highlight' : ''}`}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column' }}
                          >
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                              {/* Left section with square icon + URL details */}
                              <div className="link-row-left">
                                <div className={`row-icon-square ${colorClass}`}>
                                  <Link2 size={18} />
                                </div>
                                <div className="url-info">
                                  <a
                                    href={url.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${url.shortCode}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="short-url-link"
                                  >
                                    {url.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${url.shortCode}`}
                                    <ExternalLink size={14} style={{ opacity: 0.6 }} />
                                  </a>
                                  <span className="long-url" title={url.originalUrl}>
                                    {url.originalUrl}
                                  </span>
                                </div>
                              </div>

                              {/* Middle-left section with Created Date */}
                              <div className="link-stat" style={{ minWidth: '120px' }}>
                                <span className="stat-label">Created</span>
                                <span className="stat-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                                  {formatDate(url.createdAt)}
                                </span>
                              </div>

                              {/* Middle section with click counts */}
                              <div className="link-stat" style={{ minWidth: '120px' }}>
                                <span className="stat-label">Total Clicks</span>
                                <span className="stat-value clicks" style={{ color: 'var(--secondary-accent)' }}>{url.clicks || 0}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {url.clicks > 0 && url.lastVisited
                                    ? `Last visited: ${formatLastVisited(url.lastVisited)}`
                                    : 'Never visited'}
                                </span>
                              </div>

                              {/* Performance: Analytics/QR buttons */}
                              <div className="link-stat">
                                <span className="stat-label">Performance</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setActiveAnalyticsId(activeAnalyticsId === url.id ? null : url.id);
                                      setActiveQrId(null);
                                      setEditingId(null);
                                    }}
                                    className="btn-logout"
                                    style={{
                                      border: '1px solid rgba(0, 188, 212, 0.2)',
                                      color: 'var(--secondary-accent)',
                                      display: 'inline-flex',
                                      gap: '4px',
                                      width: 'fit-content',
                                      background: activeAnalyticsId === url.id ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                                      padding: '6px 10px',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <BarChart2 size={12} />
                                    <span>{activeAnalyticsId === url.id ? 'Collapse' : 'Analytics'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveQrId(activeQrId === url.id ? null : url.id);
                                      setActiveAnalyticsId(null);
                                      setEditingId(null);
                                    }}
                                    className="btn-logout"
                                    style={{
                                      border: '1px solid rgba(139, 195, 74, 0.25)',
                                      color: 'var(--primary-accent)',
                                      display: 'inline-flex',
                                      gap: '4px',
                                      width: 'fit-content',
                                      background: activeQrId === url.id ? 'rgba(139, 195, 74, 0.08)' : 'transparent',
                                      padding: '6px 10px',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <QrCode size={12} />
                                    <span>{activeQrId === url.id ? 'Hide' : 'QR'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Actions: edit, copy, delete */}
                              <div className="link-actions">
                                <button
                                  className="action-btn"
                                  onClick={() => handleEditClick(url)}
                                  title="Edit original URL"
                                  style={{
                                    color: editingId === url.id ? 'var(--primary)' : 'inherit',
                                    background: editingId === url.id ? 'rgba(139, 195, 74, 0.15)' : 'transparent',
                                  }}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="action-btn"
                                  onClick={() => handleCopy(url.id, url.shortCode)}
                                  title="Copy short link"
                                >
                                  {copiedId === url.id ? <Check size={16} style={{ color: 'var(--primary-accent)' }} /> : <Copy size={16} />}
                                </button>
                                <button
                                  className="action-btn btn-delete"
                                  onClick={() => handleDelete(url.id)}
                                  title="Delete URL"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Inline Edit Panel */}
                            <div
                              className="analytics-expand-wrapper"
                              style={{
                                maxHeight: editingId === url.id ? '220px' : '0px',
                                opacity: editingId === url.id ? 1 : 0,
                                overflow: 'hidden',
                                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                                pointerEvents: editingId === url.id ? 'auto' : 'none',
                                width: '100%'
                              }}
                            >
                              {editingId === url.id && (
                                <div className="analytics-inline-panel" style={{ padding: '20px 0 0 0' }}>
                                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                    Edit Destination URL
                                  </h4>
                                  <form onSubmit={(e) => handleSaveEdit(e, url.id)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-container" style={{ width: '100%' }}>
                                      <Link2 className="input-icon" style={{ left: '12px', width: '16px', height: '16px' }} />
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
                                        placeholder="Enter new destination URL (e.g. google.com)..."
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        disabled={editSubmitting}
                                      />
                                    </div>
                                    {editError && (
                                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '-4px' }}>
                                        {editError}
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                      <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '8px 16px', width: 'auto', minHeight: 'unset', height: '36px' }}
                                        disabled={editSubmitting}
                                      >
                                        {editSubmitting ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-logout"
                                        style={{ fontSize: '0.8rem', padding: '8px 16px', border: '1px solid var(--border-color)', background: 'transparent' }}
                                        onClick={() => setEditingId(null)}
                                        disabled={editSubmitting}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}
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
                                width: '100%'
                              }}
                            >
                              {activeAnalyticsId === url.id && (
                                <AnalyticsPanel urlId={url.id} />
                              )}
                            </div>

                            {/* Inline QR Code Panel */}
                            <div
                              className="analytics-expand-wrapper"
                              style={{
                                maxHeight: activeQrId === url.id ? '360px' : '0px',
                                opacity: activeQrId === url.id ? 1 : 0,
                                overflow: 'hidden',
                                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                                pointerEvents: activeQrId === url.id ? 'auto' : 'none',
                                width: '100%'
                              }}
                            >
                              {activeQrId === url.id && (
                                <div className="analytics-inline-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0 0 0' }}>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                                    Scan to open: <strong style={{ color: 'var(--text-secondary)' }}>{url.shortUrl || url.shortCode}</strong>
                                  </p>
                                  <div
                                    ref={el => qrRefs.current[url.id] = el}
                                    style={{
                                      background: '#ffffff',
                                      padding: '12px',
                                      borderRadius: '12px',
                                      display: 'inline-block',
                                      boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                                      border: '1px solid #f1f5f9'
                                    }}
                                  >
                                    <QRCodeSVG
                                      value={url.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${url.shortCode}`}
                                      size={160}
                                      bgColor="#ffffff"
                                      fgColor="#0d1b2a"
                                      level="M"
                                      includeMargin={false}
                                    />
                                  </div>
                                  <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.8rem', padding: '8px 18px', display: 'inline-flex', gap: '6px', alignItems: 'center', width: 'auto', minHeight: 'unset', height: '36px' }}
                                    onClick={() => {
                                      const svgEl = qrRefs.current[url.id]?.querySelector('svg');
                                      if (!svgEl) return;
                                      const svgData = new XMLSerializer().serializeToString(svgEl);
                                      const canvas = document.createElement('canvas');
                                      const size = 320;
                                      canvas.width = size;
                                      canvas.height = size;
                                      const ctx = canvas.getContext('2d');
                                      const img = new Image();
                                      img.onload = () => {
                                        ctx.fillStyle = '#ffffff';
                                        ctx.fillRect(0, 0, size, size);
                                        ctx.drawImage(img, 0, 0, size, size);
                                        const a = document.createElement('a');
                                        a.download = `qr-${url.shortCode}.png`;
                                        a.href = canvas.toDataURL('image/png');
                                        a.click();
                                      };
                                      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                                    }}
                                  >
                                    <Download size={14} />
                                    Download QR
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'My Links' && (
            <>
              <div className="dashboard-header">
                <h1 className="dashboard-title">My Links</h1>
                <p className="dashboard-subtitle">Manage and monitor all your shortened URLs in one list.</p>
              </div>
              <section className="links-section">
                <div className="links-grid">
                  {urls.map((url, index) => {
                    const colorClass = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'teal' : 'blue';
                    return (
                      <div key={url.id} className="link-row-card">
                        <div className="link-row-left">
                          <div className={`row-icon-square ${colorClass}`}>
                            <Link2 size={18} />
                          </div>
                          <div className="url-info">
                            <a href={url.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${url.shortCode}`} target="_blank" rel="noreferrer" className="short-url-link">
                              {url.shortUrl || `${import.meta.env.VITE_BACKEND_URL}/${url.shortCode}`}
                            </a>
                            <span className="long-url">{url.originalUrl}</span>
                          </div>
                        </div>
                        <div className="link-stat">
                          <span className="stat-label">Clicks</span>
                          <span className="stat-value">{url.clicks || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activeTab === 'Analytics' && (
            <>
              <div className="dashboard-header">
                <h1 className="dashboard-title">Analytics Dashboard</h1>
                <p className="dashboard-subtitle">Aggregate metrics, user engagement patterns, and redirection metrics.</p>
              </div>
              <div className="stat-card-white" style={{ padding: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Performance Highlights</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Here is a ranking of your most active links by click volume:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...urls].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5).map((url, idx) => (
                    <div key={url.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600' }}>#{idx + 1} {url.shortCode}</span>
                      <span style={{ color: 'var(--secondary-accent)', fontWeight: 'bold' }}>{url.clicks || 0} Clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Domains' && (
            <div className="stat-card-white" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Globe size={48} style={{ color: 'var(--secondary-accent)' }} />
              <h2>Branded Custom Domains</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px' }}>
                Connect your own domain (e.g. <strong>links.mybrand.com</strong>) to build brand authority and boost CTR.
              </p>
              <span className="user-tag" style={{ background: 'rgba(0,188,212,0.1)', color: 'var(--secondary-accent)', fontWeight: 'bold' }}>
                PRO FEATURE
              </span>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Connect Domain</button>
            </div>
          )}

          {activeTab === 'Teams' && (
            <div className="stat-card-white" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Users size={48} style={{ color: 'var(--primary)' }} />
              <h2>Collaborative Team Workspaces</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px' }}>
                Invite marketing, sales, and engineering team members to create, edit, and track links collaboratively.
              </p>
              <span className="user-tag" style={{ background: 'rgba(139,195,74,0.1)', color: 'var(--primary-accent)', fontWeight: 'bold' }}>
                PRO FEATURE
              </span>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Create Team</button>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="stat-card-white" style={{ padding: '32px' }}>
              <h2 style={{ marginBottom: '20px' }}>Account Settings</h2>
              <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="text" className="form-input" disabled value={user?.email || ''} style={{ paddingLeft: '16px' }} />
                </div>
                <div>
                  <label className="form-label">User Role</label>
                  <input type="text" className="form-input" disabled value={user?.role || 'user'} style={{ paddingLeft: '16px' }} />
                </div>
                <div>
                  <label className="form-label">API Key</label>
                  <input type="text" className="form-input" disabled value="sk_snip_86895bbd69d821213f" style={{ paddingLeft: '16px', fontFamily: 'monospace' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Billing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="stat-card-white" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>Free Starter Plan</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ month</span></p>
                  <p style={{ color: 'var(--text-muted)' }}>Ideal for basic personal link shortening and real-time tracking.</p>
                </div>
                <button className="btn-logout" disabled style={{ width: '100%', marginTop: '20px', cursor: 'default' }}>Current Plan</button>
              </div>

              <div className="stat-card-white" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '2px solid var(--primary-accent)', minHeight: '300px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-accent)' }}>Pro Plan</h3>
                    <span className="user-tag" style={{ background: 'rgba(139,195,74,0.1)', color: 'var(--primary-accent)', fontWeight: 'bold' }}>POPULAR</span>
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '12px 0' }}>$9 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ month</span></p>
                  <p style={{ color: 'var(--text-muted)' }}>Unlimited links, custom branded domains, team management, and 1-year analytics retention.</p>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => alert('Billing integration mockup: Thank you for upgrading to Pro!')}>Upgrade to Pro</button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="redesigned-footer">
          <div className="footer-logo">
            <Zap className="logo-icon-green" size={20} fill="#8bc34a" />
            <span>MagicURL</span>
          </div>
          <div className="footer-tagline">Shorten. Track. Optimize.</div>
          <div className="footer-copy">© {new Date().getFullYear()} MagicURL. All rights reserved.</div>
        </footer>
      </div>

      {/* Persistent Copied Toast */}
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
