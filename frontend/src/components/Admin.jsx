import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Navbar from './Navbar';
import AnalyticsView from './AnalyticsView';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Link2, Trash2, ExternalLink, Calendar, 
  Users, BarChart2, Shield, Eye
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
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

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

  // Compute stats
  const totalLinks = urls.length;
  const uniqueUsers = new Set(urls.map(u => u.User?.email)).size;
  const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);

  return (
    <div className="app-layout">
      {/* Shared Navbar with user credentials */}
      <Navbar user={user} setUser={setUser} />

      <main className="dashboard-content">
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Admin Panel <span className="user-tag" style={{ border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: 'bold' }}><Shield size={13} /> Admin</span>
            </h1>
            <p className="dashboard-subtitle">Monitor and manage all shortened URLs across users in real-time.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary Widgets */}
        <section className="analytics-widgets" style={{ marginBottom: '40px' }}>
          <div className="widget-card">
            <Link2 className="widget-icon" style={{ color: 'var(--primary)' }} />
            <span className="widget-title">Total Links</span>
            <span className="widget-value">{loading ? '...' : totalLinks}</span>
          </div>
          <div className="widget-card">
            <Users className="widget-icon" style={{ color: 'var(--accent)' }} />
            <span className="widget-title">Active Users</span>
            <span className="widget-value">{loading ? '...' : uniqueUsers}</span>
          </div>
          <div className="widget-card">
            <BarChart2 className="widget-icon" style={{ color: 'var(--secondary)' }} />
            <span className="widget-title">Total Clicks</span>
            <span className="widget-value">{loading ? '...' : totalClicks}</span>
          </div>
        </section>

        {/* Links Table */}
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
            <div className="table-wrapper">
              <table className="visits-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Original URL</th>
                    <th>Short Code</th>
                    <th>Clicks</th>
                    <th>Created</th>
                    <th style={{ textAlignment: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url) => (
                    <tr 
                      key={url.id} 
                      className={highlightedId === url.id ? 'flash-highlight' : ''}
                      style={{ transition: 'background-color 0.3s ease' }}
                    >
                      <td style={{ fontWeight: '500' }}>
                        {url.User?.email || 'Unknown'}
                      </td>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={url.originalUrl}>
                        <a href={url.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>
                          {url.originalUrl}
                        </a>
                      </td>
                      <td>
                        <a 
                          href={url.shortUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/${url.shortCode}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {url.shortCode}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                        {url.clicks}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          {formatDate(url.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => setActiveAnalyticsId(url.id)}
                            title="View detailed visits"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="action-btn btn-delete" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleDelete(url.id)}
                            title="Admin Delete URL"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

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
