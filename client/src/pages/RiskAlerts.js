import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiShield, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const ALERT_TYPES = [
  'route_disruption', 'financial', 'logistics', 'quality', 'regulatory',
  'weather', 'cyber', 'capacity', 'compliance', 'inventory',
  'demand', 'labor', 'environmental', 'geopolitical', 'cost',
];

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['active', 'acknowledged', 'resolved', 'dismissed'];

const severityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const statusColors = {
  active: '#ef4444',
  acknowledged: '#3b82f6',
  resolved: '#22c55e',
  dismissed: '#64748b',
};

function getRiskScoreColor(score) {
  const n = parseFloat(score);
  if (n >= 8) return '#ef4444';
  if (n >= 6) return '#f97316';
  if (n >= 3) return '#eab308';
  return '#22c55e';
}

function formatAlertType(type) {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginLeft: '56px',
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: '12px',
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ef4444',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  aiBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.3)',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
    color: '#a78bfa',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tableCard: {
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #334155',
    background: 'rgba(15,23,42,0.5)',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#e2e8f0',
    borderBottom: '1px solid #1e293b',
  },
  row: {
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  severityBadge: (severity) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    background: severityColors[severity] || '#64748b',
    textTransform: 'capitalize',
  }),
  statusBadge: (status) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    background: statusColors[status] || '#64748b',
    textTransform: 'capitalize',
  }),
  riskScoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  riskBarBg: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    background: '#0f172a',
    overflow: 'hidden',
    maxWidth: '80px',
  },
  riskBarFill: (score) => ({
    height: '100%',
    borderRadius: '4px',
    width: `${(parseFloat(score) / 10) * 100}%`,
    background: getRiskScoreColor(score),
    transition: 'width 0.3s',
  }),
  riskScoreLabel: (score) => ({
    fontSize: '13px',
    fontWeight: '700',
    color: getRiskScoreColor(score),
    minWidth: '24px',
  }),
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(239,68,68,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#64748b',
  },
};

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'alert_type', label: 'Alert Type', render: (v) => formatAlertType(v) },
  {
    key: 'severity',
    label: 'Severity',
    render: (v) => (
      <span style={styles.severityBadge(v)}>{v}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => (
      <span style={styles.statusBadge(v)}>{v}</span>
    ),
  },
  { key: 'source', label: 'Source' },
  { key: 'affected_entity', label: 'Affected Entity' },
  {
    key: 'risk_score',
    label: 'Risk Score',
    render: (v) => (
      <div style={styles.riskScoreContainer}>
        <span style={styles.riskScoreLabel(v)}>{parseFloat(v).toFixed(1)}</span>
        <div style={{ ...styles.riskBarBg, maxWidth: '120px' }}>
          <div style={styles.riskBarFill(v)} />
        </div>
      </div>
    ),
  },
  { key: 'region', label: 'Region' },
  { key: 'description', label: 'Description' },
  { key: 'recommended_action', label: 'Recommended Action' },
  {
    key: 'created_at',
    label: 'Created',
    render: (v) => v ? new Date(v).toLocaleString() : 'N/A',
  },
  {
    key: 'updated_at',
    label: 'Last Updated',
    render: (v) => v ? new Date(v).toLocaleString() : 'N/A',
  },
];

function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await API.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      toast.error('Failed to load risk alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    API.get('/suppliers').then(res => setSuppliers(res.data));
  }, []);

  const formFields = [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Alert title', fullWidth: true },
    { key: 'alert_type', label: 'Alert Type', type: 'select', options: ALERT_TYPES },
    { key: 'severity', label: 'Severity', type: 'select', options: SEVERITIES },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'active' },
    { key: 'source', label: 'Source', type: 'text', placeholder: 'e.g., AI Detection System' },
    { key: 'affected_entity', label: 'Affected Entity', type: 'select', options: suppliers.map(s => s.name) },
    { key: 'risk_score', label: 'Risk Score (0-10)', type: 'number', placeholder: '0-10', step: '0.1' },
    { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g., Asia Pacific' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the risk alert...', fullWidth: true },
    { key: 'recommended_action', label: 'Recommended Action', type: 'textarea', placeholder: 'Suggested mitigation steps...', fullWidth: true },
  ];

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  const handleRowClick = (alert) => {
    setSelectedAlert(alert);
    setDetailOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (alert) => {
    setDetailOpen(false);
    setEditData(alert);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this risk alert?')) return;
    try {
      await API.delete(`/alerts/${id}`);
      toast.success('Risk alert deleted');
      setDetailOpen(false);
      setSelectedAlert(null);
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to delete risk alert');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/alerts/${data.id}`, data);
        toast.success('Risk alert updated');
      } else {
        await API.post('/alerts', data);
        toast.success('Risk alert created');
      }
      setFormOpen(false);
      setEditData(null);
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to save risk alert');
      console.error(err);
    }
  };

  const handleAiAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/assess-supplier-risk', {});
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

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              <FiShield size={22} color="#fff" />
            </div>
            <div style={styles.title}>Risk Alerts</div>
            {activeCount > 0 && (
              <div style={styles.activeBadge}>
                <div style={styles.activeDot} />
                {activeCount} Active
              </div>
            )}
          </div>
          <div style={styles.subtitle}>
            Monitor and manage supply chain risk alerts across all operations
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.aiBtn}
            onClick={handleAiAnalysis}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiCpu size={16} />
            AI Risk Analysis
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
            <FiPlus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading risk alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiShield size={28} color="#ef4444" />
            </div>
            <div style={styles.emptyTitle}>No Risk Alerts</div>
            <div style={styles.emptySub}>
              Create your first risk alert to start monitoring supply chain risks
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Alert Type</th>
                <th style={styles.th}>Severity</th>
                <th style={styles.th}>Affected Entity</th>
                <th style={styles.th}>Risk Score</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  style={styles.row}
                  onClick={() => handleRowClick(alert)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alert.title}
                  </td>
                  <td style={{ ...styles.td, color: '#94a3b8' }}>
                    {formatAlertType(alert.alert_type)}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.severityBadge(alert.severity)}>
                      {alert.severity}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#94a3b8' }}>
                    {alert.affected_entity || 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.riskScoreContainer}>
                      <span style={styles.riskScoreLabel(alert.risk_score)}>
                        {parseFloat(alert.risk_score).toFixed(1)}
                      </span>
                      <div style={styles.riskBarBg}>
                        <div style={styles.riskBarFill(alert.risk_score)} />
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(alert.status)}>
                      {alert.status}
                    </span>
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
        onClose={() => { setDetailOpen(false); setSelectedAlert(null); }}
        title="Risk Alert Details"
        fields={detailFields}
        item={selectedAlert}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Risk Alert' : 'New Risk Alert'}
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
        title="AI Risk Assessment"
      />
    </div>
  );
}

export default RiskAlerts;
