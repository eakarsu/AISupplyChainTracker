import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function AIUsageStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/ai/usage-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stats');
      setStats(data);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const maxCalls = stats?.per_endpoint?.reduce((m, e) => Math.max(m, parseInt(e.call_count)), 0) || 1;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>AI Usage & Cost Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Token usage, latency, and cost estimates per AI endpoint</p>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading usage stats...</div>
      ) : !stats ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>No AI usage data yet.</div>
      ) : (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{stats.totals?.total_calls || 0}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Total AI Calls</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>
                {(stats.totals?.total_tokens || 0).toLocaleString()}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Tokens</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                ${stats.totals?.estimated_total_cost_usd || '0.0000'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Estimated Cost (USD)</div>
            </div>
          </div>

          {/* Per endpoint table */}
          <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>Usage by Endpoint</h2>
            </div>
            {stats.per_endpoint?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No AI calls recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      {['Endpoint', 'Calls', 'Usage Bar', 'Avg Tokens', 'Total Tokens', 'Avg Latency', 'Cost (USD)', 'Last Called'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.per_endpoint.map((e, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.875rem 1rem', color: '#60a5fa', fontWeight: 500 }}>{e.endpoint}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#e2e8f0' }}>{e.call_count}</td>
                        <td style={{ padding: '0.875rem 1rem', minWidth: '100px' }}>
                          <div style={{ background: '#0f172a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${(parseInt(e.call_count) / maxCalls) * 100}%`,
                              height: '100%', background: '#3b82f6', borderRadius: '4px',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#94a3b8' }}>
                          {e.avg_tokens ? Math.round(parseFloat(e.avg_tokens)).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#8b5cf6' }}>
                          {e.total_tokens ? parseInt(e.total_tokens).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#94a3b8' }}>
                          {e.avg_latency_ms ? `${Math.round(parseFloat(e.avg_latency_ms))}ms` : 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#10b981', fontWeight: 600 }}>
                          ${e.estimated_cost_usd}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {e.last_called ? new Date(e.last_called).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
            Cost estimate based on claude-3-5-sonnet-20241022 pricing (~$9/1M tokens avg). Actual costs may vary.
          </div>
        </div>
      )}
    </div>
  );
}
