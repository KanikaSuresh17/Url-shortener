import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import AnalyticsView from './AnalyticsView';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Link2, Trash2, ExternalLink, Calendar, 
  Users, BarChart2, Shield, Eye,
  Zap, Crown, LayoutDashboard, Globe, Settings, CreditCard, LogOut, TrendingUp, Award, Activity
} from 'lucide-react';

export default function Admin({ user, setUser }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAnalyticsId, setActiveAnalyticsId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    async function fetchAllUrls() {
      try {
        setLoading(true);
        const data = await api.getAllUrlsAdmin();
        setUrls(data);
      } catch (err) {
        setError('Failed to fetch admin dashboard stats and URLs.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllUrls();
  }, [navigate, user]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL);

    socket.on('click_update', (data) => {
      setUrls((prevUrls) => {
        const index = prevUrls.findIndex(
          (u) => u.id === data.urlId || u.shortCode === data.shortCode
        );
        if (index !== -1) {
          setHighlightedId(data.urlId);
          setTimeout(() => setHighlightedId(null), 1000);

          const updated = [...prevUrls];
          updated[index] = { ...updated[index], clicks: data.clicks };
          return updated;
        }
        return prevUrls;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this URL as an admin?')) {
      return;
    }

    try {
      await api.adminDeleteUrl(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
      if (activeAnalyticsId === id) {
        setActiveAnalyticsId(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete URL');
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
    if (tabName === 'Dashboard') {
      navigate('/dashboard');
      return;
    }
    alert(`${tabName} section is available on the main Dashboard.`);
  };

  // Compute stats
  const totalLinks = urls.length;
  const uniqueUsers = new Set(urls.map(u => u.User?.email)).size;
  const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);

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
            <span>SnipURL</span>
          </div>

          <nav className="sidebar-nav">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Admin Panel', icon: Shield },
              { name: 'Analytics', icon: BarChart2 },
              { name: 'Domains', icon: Globe },
              { name: 'Settings', icon: Settings },
              { name: 'Billing', icon: CreditCard },
              { name: 'Logout', icon: LogOut },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.name}
                  className={`sidebar-nav-item ${item.name === 'Admin Panel' ? 'active' : ''}`}
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
          <button className="upgrade-btn" onClick={() => handleTabClick('Dashboard')}>Upgrade</button>
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
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span>{user.email} (Admin)</span>
              </div>
            )}
          </div>

          <div className="header-right">
            <button className="btn-logout-dark" onClick={handleLogout}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Admin Dashboard Main Content */}
        <main className="dashboard-content" style={{ zIndex: 10 }}>
          <div className="dashboard-header">
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Admin Panel
            </h1>
            <p className="dashboard-subtitle">Monitor and manage all shortened URLs across users in real-time.</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Summary Widgets */}
          <section className="stats-grid-four">
            <div className="stat-card-white">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Links</span>
                <div className="stat-icon-square green">
                  <Link2 size={20} />
                </div>
              </div>
              <span className="stat-card-value">{loading ? '...' : totalLinks}</span>
              <span className="stat-card-trend"><TrendingUp size={12} /> System wide</span>
            </div>

            <div className="stat-card-white">
              <div className="stat-card-header">
                <span className="stat-card-title">Active Users</span>
                <div className="stat-icon-square teal">
                  <Users size={20} />
                </div>
              </div>
              <span className="stat-card-value">{loading ? '...' : uniqueUsers}</span>
              <span className="stat-card-trend"><TrendingUp size={12} /> Registered accounts</span>
            </div>

            <div className="stat-card-white">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Clicks</span>
                <div className="stat-icon-square blue">
                  <BarChart2 size={20} />
                </div>
              </div>
              <span className="stat-card-value">{loading ? '...' : totalClicks}</span>
              <span className="stat-card-trend"><TrendingUp size={12} /> Across all links</span>
            </div>

            <div className="stat-card-white">
              <div className="stat-card-header">
                <span className="stat-card-title">System Average</span>
                <div className="stat-icon-square gray">
                  <Award size={20} />
                </div>
              </div>
              <span className="stat-card-value">
                {loading ? '...' : totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : '0'}
              </span>
              <span className="stat-card-trend"><TrendingUp size={12} /> Clicks per link</span>
            </div>
          </section>

          {/* Links Section */}
          <section className="links-section">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>All Shortened Links</h3>

            {loading ? (
              <div className="loading-container" style={{ minHeight: '200px' }}>
                <div className="spinner"></div>
              </div>
            ) : urls.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-icon" />
                <h3>No links have been created on the platform yet</h3>
              </div>
            ) : (
              <div className="links-grid">
                <AnimatePresence>
                  {urls.map((url, index) => {
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
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Owner: <strong style={{ color: 'var(--text-primary)' }}>{url.User?.email || 'Unknown'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="link-stat" style={{ minWidth: '120px' }}>
                            <span className="stat-label">Created</span>
                            <span className="stat-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                              {formatDate(url.createdAt)}
                            </span>
                          </div>

                          <div className="link-stat" style={{ minWidth: '80px' }}>
                            <span className="stat-label">Clicks</span>
                            <span className="stat-value clicks" style={{ color: 'var(--secondary-accent)' }}>
                              {url.clicks || 0}
                            </span>
                          </div>

                          <div className="link-actions">
                            <button 
                              className="action-btn"
                              onClick={() => setActiveAnalyticsId(url.id)}
                              title="View detailed visits"
                            >
                              <Eye size={16} />
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
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="redesigned-footer">
          <div className="footer-logo">
            <Zap className="logo-icon-green" size={20} fill="#8bc34a" />
            <span>SnipURL</span>
          </div>
          <div className="footer-tagline">Shorten. Track. Optimize.</div>
          <div className="footer-copy">© {new Date().getFullYear()} SnipURL. All rights reserved.</div>
        </footer>
      </div>

      {/* Analytics Modal details popup */}
      <AnimatePresence>
        {activeAnalyticsId && (
          <AnalyticsView 
            urlId={activeAnalyticsId} 
            onClose={() => setActiveAnalyticsId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
