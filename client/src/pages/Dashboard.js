import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiUsers, FiAlertTriangle, FiPackage, FiShield, FiMap, FiTrendingUp, FiShoppingCart, FiCpu, FiGrid, FiFileText, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: (color) => ({
    padding: '24px', borderRadius: '16px', cursor: 'pointer',
    background: `linear-gradient(135deg, ${color}15, ${color}08)`,
    border: `1px solid ${color}30`, transition: 'all 0.3s',
    position: 'relative', overflow: 'hidden',
  }),
  cardIcon: (color) => ({
    width: '48px', height: '48px', borderRadius: '12px',
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '16px',
  }),
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' },
  cardValue: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' },
  cardSub: { fontSize: '12px', color: '#64748b' },
  aiSection: { marginTop: '32px' },
  aiCard: {
    padding: '24px', borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))',
    border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s',
  },
  aiIcon: {
    width: '56px', height: '56px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
};

const cards = [
  { path: '/shipments', label: 'Shipment Tracking', icon: FiTruck, color: '#3b82f6', key: 'shipments', sub: (s) => `${s.active} in transit` },
  { path: '/suppliers', label: 'Suppliers', icon: FiUsers, color: '#10b981', key: 'suppliers', sub: (s) => `Avg risk: ${s.avgRisk}` },
  { path: '/disruptions', label: 'Disruptions', icon: FiAlertTriangle, color: '#f59e0b', key: 'disruptions', sub: (s) => `${s.critical} critical` },
  { path: '/inventory', label: 'Inventory', icon: FiPackage, color: '#8b5cf6', key: 'inventory', sub: (s) => `$${Number(s.totalValue).toLocaleString()} value` },
  { path: '/alerts', label: 'Risk Alerts', icon: FiShield, color: '#ef4444', key: 'alerts', sub: (s) => `${s.active} active` },
  { path: '/routes', label: 'Shipping Routes', icon: FiMap, color: '#06b6d4', key: 'routes', sub: () => 'Optimized' },
  { path: '/demand', label: 'Demand Forecasts', icon: FiTrendingUp, color: '#ec4899', key: 'forecasts', sub: () => 'AI predictions' },
  { path: '/orders', label: 'Purchase Orders', icon: FiShoppingCart, color: '#f97316', key: 'orders', sub: (s) => `$${Number(s.totalValue).toLocaleString()} total` },
  { path: '/warehouses', label: 'Warehouses', icon: FiGrid, color: '#14b8a6', key: 'warehouses', sub: (s) => `${s.totalCapacity || 0}% avg capacity` },
  { path: '/compliance', label: 'Compliance', icon: FiFileText, color: '#a855f7', key: 'compliance', sub: (s) => `${s.active || 0} active` },
  { path: '/quality', label: 'Quality Control', icon: FiCheckCircle, color: '#22d3ee', key: 'quality', sub: (s) => `${s.passRate || 0}% pass rate` },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2, color: '#f43f5e', key: 'analytics', sub: () => 'Charts & Reports' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    API.get('/dashboard/stats').then((res) => setStats(res.data)).catch(console.error);
  }, []);

  const runAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze', { query: 'Provide a comprehensive supply chain health analysis with risk assessment and recommendations.' });
      setAiAnalysis(res.data);
    } catch (err) {
      setAiAnalysis({ analysis: 'Error: ' + (err.response?.data?.error || err.message), type: 'error', timestamp: new Date().toISOString() });
    }
    setAiLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>Supply Chain Dashboard</div>
        <div style={styles.subtitle}>Real-time overview of your supply chain operations</div>
      </div>

      <div style={styles.grid}>
        {cards.map((c) => (
          <div
            key={c.path}
            style={styles.card(c.color)}
            onClick={() => navigate(c.path)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${c.color}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={styles.cardIcon(c.color)}>
              <c.icon size={24} color="#fff" />
            </div>
            <div style={styles.cardTitle}>{c.label}</div>
            <div style={styles.cardValue}>{stats[c.key]?.total || 0}</div>
            <div style={styles.cardSub}>{stats[c.key] ? c.sub(stats[c.key]) : 'Loading...'}</div>
          </div>
        ))}
      </div>

      <div style={styles.aiSection}>
        <div
          style={styles.aiCard}
          onClick={runAnalysis}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(59,130,246,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={styles.aiIcon}><FiCpu size={28} color="#fff" /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
              AI Supply Chain Analysis
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Click to run a comprehensive AI-powered analysis of your entire supply chain health, risks, and optimization opportunities
            </div>
          </div>
        </div>
      </div>

      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="Supply Chain Health Analysis"
      />
    </div>
  );
}

export default Dashboard;
