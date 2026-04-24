import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiTrendingUp, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const trendConfig = {
  growing: {
    bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)',
    arrow: '\u2191', label: 'Growing',
  },
  stable: {
    bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)',
    arrow: '\u2013', label: 'Stable',
  },
  declining: {
    bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)',
    arrow: '\u2193', label: 'Declining',
  },
};

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: {
    fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  titleIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #ec4899, #db2777)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.3)',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsRow: {
    display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
  },
  statBadge: (color) => ({
    padding: '6px 14px', borderRadius: '8px',
    background: color + '12', border: `1px solid ${color}30`,
    fontSize: '13px', fontWeight: '600', color: color,
  }),
  tableWrapper: {
    borderRadius: '16px', border: '1px solid #334155',
    background: '#1e293b', overflow: 'hidden',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #334155', background: '#1e293b',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #334155',
  },
  row: {
    cursor: 'pointer', transition: 'background 0.2s',
  },
  badge: (colors) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
  }),
  changePositive: {
    display: 'inline-flex', alignItems: 'center', gap: '2px',
    fontSize: '12px', fontWeight: '600', color: '#22c55e',
  },
  changeNegative: {
    display: 'inline-flex', alignItems: 'center', gap: '2px',
    fontSize: '12px', fontWeight: '600', color: '#ef4444',
  },
  changeNeutral: {
    display: 'inline-flex', alignItems: 'center', gap: '2px',
    fontSize: '12px', fontWeight: '600', color: '#94a3b8',
  },
  confidenceBarOuter: {
    width: '100%', maxWidth: '120px', height: '8px', borderRadius: '4px',
    background: '#334155', overflow: 'hidden', display: 'inline-block',
    verticalAlign: 'middle',
  },
  confidenceBarInner: (score) => ({
    height: '100%', borderRadius: '4px',
    width: `${Math.min(Math.max(score, 0), 100)}%`,
    background: score >= 75 ? 'linear-gradient(90deg, #22c55e, #16a34a)'
      : score >= 50 ? 'linear-gradient(90deg, #eab308, #ca8a04)'
      : 'linear-gradient(90deg, #ef4444, #dc2626)',
    transition: 'width 0.3s ease',
  }),
  emptyState: {
    padding: '60px 20px', textAlign: 'center',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: '#64748b' },
};

const formatNumber = (num) => {
  if (num == null || num === '') return 'N/A';
  return Number(num).toLocaleString();
};

const getDemandChange = (current, predicted) => {
  if (!current || !predicted || Number(current) === 0) return null;
  const change = ((Number(predicted) - Number(current)) / Number(current)) * 100;
  return change;
};

// formFields moved inside component for dynamic product options

const detailFields = [
  { key: 'product_name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  {
    key: 'current_demand', label: 'Current Demand',
    render: (val) => val != null ? formatNumber(val) : 'N/A',
  },
  {
    key: 'predicted_demand', label: 'Predicted Demand',
    render: (val, item) => {
      if (val == null) return 'N/A';
      const change = getDemandChange(item.current_demand, val);
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{formatNumber(val)}</span>
          {change !== null && (
            <span style={change > 0 ? styles.changePositive : change < 0 ? styles.changeNegative : styles.changeNeutral}>
              {change > 0 ? '\u2191' : change < 0 ? '\u2193' : '\u2013'}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </span>
      );
    },
  },
  {
    key: 'confidence_score', label: 'Confidence Score',
    render: (val) => {
      const score = Number(val) || 0;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.confidenceBarOuter}>
            <span style={styles.confidenceBarInner(score)} />
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{score}%</span>
        </span>
      );
    },
  },
  { key: 'forecast_period', label: 'Forecast Period' },
  { key: 'region', label: 'Region' },
  {
    key: 'trend', label: 'Trend',
    render: (val) => {
      const cfg = trendConfig[val] || trendConfig.stable;
      return (
        <span style={styles.badge(cfg)}>
          {cfg.arrow} {cfg.label}
        </span>
      );
    },
  },
  {
    key: 'seasonal_factor', label: 'Seasonal Factor',
    render: (val) => val != null ? Number(val).toFixed(2) : 'N/A',
  },
  { key: 'notes', label: 'Notes', render: (val) => val || 'No notes' },
  {
    key: 'created_at', label: 'Created',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
  {
    key: 'updated_at', label: 'Last Updated',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
];

function DemandForecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const formFields = [
    { key: 'product_name', label: 'Product', type: 'select', options: products.map(p => p.product_name) },
    { key: 'category', label: 'Category', type: 'select', options: [...new Set(products.map(p => p.category).filter(Boolean))] },
    { key: 'current_demand', label: 'Current Demand', type: 'number', placeholder: 'e.g. 5000', step: '1' },
    { key: 'predicted_demand', label: 'Predicted Demand', type: 'number', placeholder: 'e.g. 6500', step: '1' },
    { key: 'confidence_score', label: 'Confidence Score (0-100)', type: 'number', placeholder: 'e.g. 85', step: '1' },
    { key: 'forecast_period', label: 'Forecast Period', placeholder: 'e.g. Q2 2026' },
    { key: 'region', label: 'Region', type: 'select', options: ['North America', 'Europe', 'Asia', 'South America', 'Oceania', 'Africa', 'Global'] },
    { key: 'trend', label: 'Trend', type: 'select', options: ['growing', 'stable', 'declining'] },
    { key: 'seasonal_factor', label: 'Seasonal Factor', type: 'number', placeholder: 'e.g. 1.2', step: '0.01' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes about this forecast...', fullWidth: true },
  ];

  const fetchForecasts = async () => {
    try {
      const res = await API.get('/demand');
      setForecasts(res.data);
    } catch (err) {
      toast.error('Failed to load demand forecasts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
    API.get('/inventory').then(res => setProducts(res.data)).catch(() => {});
  }, []);

  const handleRowClick = async (forecast) => {
    try {
      const res = await API.get(`/demand/${forecast.id}`);
      setSelectedForecast(res.data);
      setDetailOpen(true);
    } catch (err) {
      toast.error('Failed to load forecast details');
    }
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (forecast) => {
    setDetailOpen(false);
    setEditData(forecast);
    setFormOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/demand/${data.id}`, data);
        toast.success('Forecast updated successfully');
      } else {
        await API.post('/demand', data);
        toast.success('Forecast created successfully');
      }
      setFormOpen(false);
      setEditData(null);
      fetchForecasts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save forecast');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this forecast?')) return;
    try {
      await API.delete(`/demand/${id}`);
      toast.success('Forecast deleted successfully');
      setDetailOpen(false);
      setSelectedForecast(null);
      fetchForecasts();
    } catch (err) {
      toast.error('Failed to delete forecast');
    }
  };

  const runAIAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/forecast-demand', {});
      setAiAnalysis(res.data);
    } catch (err) {
      setAiAnalysis({
        analysis: 'Error: ' + (err.response?.data?.error || err.message),
        type: 'error',
        timestamp: new Date().toISOString(),
      });
    }
    setAiLoading(false);
  };

  const trendCounts = forecasts.reduce((acc, f) => {
    acc[f.trend] = (acc[f.trend] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <div style={styles.titleIcon}>
              <FiTrendingUp size={22} color="#fff" />
            </div>
            Demand Forecasting
          </div>
          <div style={styles.subtitle}>
            AI-powered demand predictions and trend analysis for your supply chain
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.aiBtn}
            onClick={runAIAnalysis}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiCpu size={16} /> AI Forecast
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FiPlus size={16} /> New Forecast
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statBadge('#f1f5f9')}>
          Total: {forecasts.length}
        </div>
        {trendCounts.growing > 0 && (
          <div style={styles.statBadge('#22c55e')}>
            Growing: {trendCounts.growing}
          </div>
        )}
        {trendCounts.stable > 0 && (
          <div style={styles.statBadge('#3b82f6')}>
            Stable: {trendCounts.stable}
          </div>
        )}
        {trendCounts.declining > 0 && (
          <div style={styles.statBadge('#ef4444')}>
            Declining: {trendCounts.declining}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading demand forecasts...
          </div>
        ) : forecasts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiTrendingUp size={28} color="#ec4899" />
            </div>
            <div style={styles.emptyTitle}>No Demand Forecasts Found</div>
            <div style={styles.emptySub}>Create your first demand forecast to get started</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Current Demand</th>
                <th style={styles.th}>Predicted Demand</th>
                <th style={styles.th}>Change</th>
                <th style={styles.th}>Confidence</th>
                <th style={styles.th}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast) => {
                const change = getDemandChange(forecast.current_demand, forecast.predicted_demand);
                const confidenceScore = Number(forecast.confidence_score) || 0;
                const cfg = trendConfig[forecast.trend] || trendConfig.stable;
                return (
                  <tr
                    key={forecast.id}
                    style={styles.row}
                    onClick={() => handleRowClick(forecast)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b80'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>
                      {forecast.product_name}
                    </td>
                    <td style={styles.td}>{forecast.category || 'N/A'}</td>
                    <td style={styles.td}>{formatNumber(forecast.current_demand)}</td>
                    <td style={styles.td}>{formatNumber(forecast.predicted_demand)}</td>
                    <td style={styles.td}>
                      {change !== null ? (
                        <span style={change > 0 ? styles.changePositive : change < 0 ? styles.changeNegative : styles.changeNeutral}>
                          {change > 0 ? '\u2191' : change < 0 ? '\u2193' : '\u2013'}
                          {Math.abs(change).toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>--</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.confidenceBarOuter}>
                          <span style={styles.confidenceBarInner(confidenceScore)} />
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', minWidth: '32px' }}>
                          {confidenceScore}%
                        </span>
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(cfg)}>
                        {cfg.arrow} {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedForecast(null); }}
        title={selectedForecast ? `Forecast: ${selectedForecast.product_name}` : 'Forecast Details'}
        fields={detailFields}
        item={selectedForecast}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Forecast' : 'New Forecast'}
        fields={formFields}
        initialData={editData}
        onSave={handleSave}
      />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Demand Forecast"
      />
    </div>
  );
}

export default DemandForecasting;
