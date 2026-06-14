import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart2, Clock, Calendar, Globe, Laptop } from 'lucide-react';

export default function AnalyticsPanel({ urlId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!urlId) return;
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError('');
      try {
        const analytics = await api.getAnalytics(urlId);
        if (!cancelled) setData(analytics);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [urlId]);

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `${datePart} at ${timePart}`;
  };

  return (
    <div className="analytics-inline-panel">
      <div className="analytics-panel-inner">
        {loading && (
          <div className="analytics-panel-loading">
            <div className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
            <span>Loading analytics…</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ margin: 0 }}>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* 3 Stat Cards */}
            <div className="analytics-widgets inline-widgets">
              <div className="widget-card inline-widget">
                <BarChart2 className="widget-icon" style={{ color: 'var(--primary)' }} />
                <span className="widget-title">Total Clicks</span>
                <span className="widget-value">{data.totalClicks}</span>
              </div>

              <div className="widget-card inline-widget">
                <Clock className="widget-icon" style={{ color: 'var(--secondary)' }} />
                <span className="widget-title">Last Visited</span>
                <span className="widget-value" style={{ fontSize: data.lastVisited ? '0.82rem' : '1.2rem' }}>
                  {data.lastVisited ? formatDate(data.lastVisited) : 'Never'}
                </span>
              </div>

              <div className="widget-card inline-widget">
                <Calendar className="widget-icon" style={{ color: 'var(--accent)' }} />
                <span className="widget-title">Created On</span>
                <span className="widget-value" style={{ fontSize: '0.82rem' }}>
                  {formatDate(data.url?.createdAt)}
                </span>
              </div>
            </div>

            {/* Recent Visit History Table */}
            <div className="history-section" style={{ marginTop: '20px' }}>
              <h4 className="history-section-title">
                Recent Visit History ({data.recentVisits.length})
              </h4>

              {data.recentVisits.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '18px 0' }}>
                  No visits yet. Share your short link to start gathering analytics!
                </p>
              ) : (
                <div className="table-wrapper" style={{ marginTop: '12px' }}>
                  <table className="visits-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>IP Address</th>
                        <th>Device / Browser Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentVisits.map((visit) => (
                        <tr key={visit.id}>
                          <td className="visit-time">{formatDate(visit.timestamp)}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                              {visit.ip || 'Unknown'}
                            </span>
                          </td>
                          <td className="user-agent-cell" title={visit.userAgent}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Laptop size={13} style={{ color: 'var(--text-muted)' }} />
                              {visit.userAgent || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
