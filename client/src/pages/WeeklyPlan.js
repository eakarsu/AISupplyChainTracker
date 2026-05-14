import React, { useState } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AGENT_COLORS = {
  route: { bg: '#1e3a5f', text: '#60a5fa', badge: '#3b82f6' },
  inventory: { bg: '#1a3a2a', text: '#34d399', badge: '#10b981' },
  demand: { bg: '#3a1a2a', text: '#f472b6', badge: '#ec4899' }
};

export default function WeeklyPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ai/weekly-plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPlan(data.plan);
      toast.success('Weekly plan generated!');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const weeklyPlan = plan?.weekly_plan || {};
  const agents = plan?.agent_outputs || {};

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>AI Weekly Operations Plan</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Multi-agent coordinator synthesizes route, inventory, and demand insights into a weekly ops plan.
      </p>

      <button
        onClick={generatePlan}
        disabled={loading}
        style={{
          background: loading ? '#334155' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: '1rem', marginBottom: '2rem'
        }}
      >
        {loading ? 'Running 3 AI Agents...' : 'Generate Weekly Plan'}
      </button>

      {plan && (
        <div>
          {/* Executive Summary */}
          {weeklyPlan.executive_summary && (
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a2744)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #3b82f620' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                EXECUTIVE SUMMARY
              </div>
              <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>{weeklyPlan.executive_summary}</p>
            </div>
          )}

          {/* KPI Targets */}
          {weeklyPlan.kpi_targets && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {Object.entries(weeklyPlan.kpi_targets).map(([key, val]) => (
                <div key={key} style={{ background: '#1e293b', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{val}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Priority Actions */}
            {weeklyPlan.priority_actions && weeklyPlan.priority_actions.length > 0 && (
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>
                  Priority Actions This Week
                </h2>
                {weeklyPlan.priority_actions.map((action, i) => {
                  const colors = AGENT_COLORS[action.agent] || AGENT_COLORS.route;
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '0.75rem', padding: '0.75rem',
                      background: colors.bg, borderRadius: '8px', marginBottom: '0.5rem', border: `1px solid ${colors.badge}20`
                    }}>
                      <div style={{ flex: 'none', textAlign: 'center' }}>
                        <span style={{ background: colors.badge, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {action.day || `Day ${i + 1}`}
                        </span>
                        <div style={{ fontSize: '0.65rem', color: colors.text, marginTop: '0.25rem', textTransform: 'uppercase' }}>
                          {action.agent}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500 }}>{action.action}</div>
                        {action.impact && (
                          <div style={{ fontSize: '0.8rem', color: colors.text, marginTop: '0.25rem' }}>{action.impact}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Risk Flags */}
            <div>
              {weeklyPlan.risk_flags && weeklyPlan.risk_flags.length > 0 && (
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
                    Risk Flags
                  </h2>
                  {weeklyPlan.risk_flags.map((flag, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: '#3f1515', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                      ⚠️ {flag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent Outputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {Object.entries(agents).map(([agentName, agentData]) => {
              const colors = AGENT_COLORS[agentName] || AGENT_COLORS.route;
              const agentLabels = { route: 'Route Agent', inventory: 'Inventory Agent', demand: 'Demand Agent' };
              const innerKey = Object.keys(agentData || {})[0];
              const innerData = agentData?.[innerKey] || {};
              return (
                <div key={agentName} style={{ background: '#1e293b', borderRadius: '12px', padding: '1rem', border: `1px solid ${colors.badge}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ background: colors.badge, width: '8px', height: '8px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text }}>{agentLabels[agentName] || agentName}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {Object.entries(innerData).slice(0, 3).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                        <span style={{ marginLeft: '0.25rem', color: '#e2e8f0' }}>
                          {Array.isArray(v) ? `${v.length} items` : String(v).slice(0, 50)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
