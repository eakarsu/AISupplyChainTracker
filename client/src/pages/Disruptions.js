import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { FiAlertTriangle, FiPlus, FiCpu } from 'react-icons/fi';

const severityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const typeLabels = {
  geopolitical: 'Geopolitical',
  natural_disaster: 'Natural Disaster',
  labor: 'Labor',
  infrastructure: 'Infrastructure',
  supply_shortage: 'Supply Shortage',
  cyber: 'Cyber',
  security: 'Security',
  regulatory: 'Regulatory',
};

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    marginBottom: '32px', display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#64748b' },
  countsRow: { display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' },
  countBadge: (color) => ({
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: `${color}20`, color: color, border: `1px solid ${color}40`,
  }),
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.4)',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.10))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  tableWrapper: {
    borderRadius: '16px', border: '1px solid #334155',
    background: '#1e293b', overflow: 'hidden',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left',
    borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.5)',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #1e293b',
  },
  tr: {
    cursor: 'pointer', transition: 'background 0.15s',
  },
  severityBadge: (severity) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
    background: `${severityColors[severity] || '#64748b'}20`,
    color: severityColors[severity] || '#64748b',
    border: `1px solid ${severityColors[severity] || '#64748b'}40`,
  }),
  typeBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.12)',
    color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)',
  },
  impactBar: {
    width: '100%', height: '6px', borderRadius: '3px', background: '#0f172a',
    overflow: 'hidden', marginTop: '4px',
  },
  impactFill: (score) => ({
    height: '100%', borderRadius: '3px', transition: 'width 0.3s',
    width: `${(score / 10) * 100}%`,
    background: score >= 8 ? '#ef4444' : score >= 5 ? '#f97316' : '#22c55e',
  }),
  emptyState: {
    textAlign: 'center', padding: '60px 20px', color: '#475569',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 16px',
  },
};

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', render: (val) => <span style={styles.typeBadge}>{typeLabels[val] || val}</span> },
  {
    key: 'severity', label: 'Severity',
    render: (val) => <span style={styles.severityBadge(val)}>{val}</span>,
  },
  { key: 'region', label: 'Region' },
  { key: 'description', label: 'Description' },
  {
    key: 'impact_score', label: 'Impact Score',
    render: (val) => (
      <div>
        <span style={{ fontWeight: '700', color: val >= 8 ? '#ef4444' : val >= 5 ? '#f97316' : '#22c55e' }}>{val}/10</span>
        <div style={styles.impactBar}>
          <div style={styles.impactFill(val)} />
        </div>
      </div>
    ),
  },
  {
    key: 'probability', label: 'Probability',
    render: (val) => <span style={{ fontWeight: '600' }}>{val}%</span>,
  },
  { key: 'affected_suppliers', label: 'Affected Suppliers' },
  { key: 'estimated_duration_days', label: 'Estimated Duration (days)' },
  { key: 'mitigation_strategy', label: 'Mitigation Strategy' },
];

function Disruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchDisruptions = async () => {
    try {
      const res = await API.get('/disruptions');
      setDisruptions(res.data);
    } catch (err) {
      toast.error('Failed to load disruptions');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisruptions();
    API.get('/suppliers').then(res => setSuppliers(res.data));
  }, []);

  const formFields = [
    { key: 'title', label: 'Title', placeholder: 'Disruption title', fullWidth: true },
    {
      key: 'type', label: 'Type', type: 'select',
      options: ['geopolitical', 'natural_disaster', 'labor', 'infrastructure', 'supply_shortage', 'cyber', 'security', 'regulatory'],
    },
    {
      key: 'severity', label: 'Severity', type: 'select',
      options: ['critical', 'high', 'medium', 'low'],
    },
    { key: 'region', label: 'Region', placeholder: 'e.g. Southeast Asia' },
    { key: 'impact_score', label: 'Impact Score (0-10)', type: 'number', placeholder: '0-10', step: '0.1' },
    { key: 'probability', label: 'Probability (%)', type: 'number', placeholder: '0-100' },
    { key: 'affected_suppliers', label: 'Affected Suppliers', type: 'select', options: suppliers.map(s => s.name), fullWidth: true },
    { key: 'estimated_duration_days', label: 'Est. Duration (days)', type: 'number', placeholder: 'Days' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the disruption...', fullWidth: true },
    { key: 'mitigation_strategy', label: 'Mitigation Strategy', type: 'textarea', placeholder: 'Recommended mitigation steps...', fullWidth: true },
  ];

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setDetailOpen(false);
    setEditData(item);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this disruption?')) return;
    try {
      await API.delete(`/disruptions/${id}`);
      toast.success('Disruption deleted');
      setDetailOpen(false);
      setSelectedItem(null);
      fetchDisruptions();
    } catch (err) {
      toast.error('Failed to delete disruption');
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/disruptions/${data.id}`, data);
        toast.success('Disruption updated');
      } else {
        await API.post('/disruptions', data);
        toast.success('Disruption created');
      }
      setFormOpen(false);
      setEditData(null);
      fetchDisruptions();
    } catch (err) {
      toast.error('Failed to save disruption');
    }
  };

  const handleAIPredict = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/predict-disruption', {});
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

  const criticalCount = disruptions.filter((d) => d.severity === 'critical').length;
  const highCount = disruptions.filter((d) => d.severity === 'high').length;
  const mediumCount = disruptions.filter((d) => d.severity === 'medium').length;
  const lowCount = disruptions.filter((d) => d.severity === 'low').length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>Disruption Predictions</div>
          <div style={styles.subtitle}>
            Monitor and predict supply chain disruptions across your network
          </div>
          <div style={styles.countsRow}>
            <span style={styles.countBadge('#ef4444')}>Critical: {criticalCount}</span>
            <span style={styles.countBadge('#f97316')}>High: {highCount}</span>
            <span style={styles.countBadge('#eab308')}>Medium: {mediumCount}</span>
            <span style={styles.countBadge('#22c55e')}>Low: {lowCount}</span>
            <span style={styles.countBadge('#94a3b8')}>Total: {disruptions.length}</span>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.aiBtn}
            onClick={handleAIPredict}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.20))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.10))'; }}
          >
            <FiCpu size={16} /> AI Predict
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiPlus size={16} /> Report Disruption
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading disruptions...</div>
        ) : disruptions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiAlertTriangle size={28} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
              No disruptions reported
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              Click "Report Disruption" to add a new disruption prediction
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Severity</th>
                <th style={styles.th}>Region</th>
                <th style={styles.th}>Impact Score</th>
                <th style={styles.th}>Probability</th>
              </tr>
            </thead>
            <tbody>
              {disruptions.map((d) => (
                <tr
                  key={d.id}
                  style={{
                    ...styles.tr,
                    background: hoveredRow === d.id ? 'rgba(59,130,246,0.06)' : 'transparent',
                  }}
                  onClick={() => handleRowClick(d)}
                  onMouseEnter={() => setHoveredRow(d.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{d.title}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{typeLabels[d.type] || d.type}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.severityBadge(d.severity)}>{d.severity}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: '#94a3b8' }}>{d.region}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontWeight: '700', fontSize: '13px',
                        color: d.impact_score >= 8 ? '#ef4444' : d.impact_score >= 5 ? '#f97316' : '#22c55e',
                      }}>
                        {d.impact_score}
                      </span>
                      <div style={{ ...styles.impactBar, flex: 1, maxWidth: '80px' }}>
                        <div style={styles.impactFill(d.impact_score)} />
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '600', color: '#94a3b8' }}>{d.probability}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedItem(null); }}
        title="Disruption Details"
        fields={detailFields}
        item={selectedItem}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Disruption' : 'Report New Disruption'}
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
        title="AI Disruption Prediction"
      />
    </div>
  );
}

export default Disruptions;
