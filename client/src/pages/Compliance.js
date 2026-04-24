import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiFileText, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const COMPLIANCE_TYPES = [
  'certification', 'regulatory', 'audit', 'environmental',
  'social', 'data_privacy', 'safety', 'ethics',
];

const STATUSES = ['passed', 'failed', 'conditional', 'pending', 'expired'];
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

const statusColors = {
  passed: '#22c55e',
  failed: '#ef4444',
  conditional: '#eab308',
  pending: '#3b82f6',
  expired: '#64748b',
};

const riskLevelColors = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

function formatLabel(str) {
  if (!str) return 'N/A';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 90;
}

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    marginBottom: '32px', display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  titleRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  titleIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '28px', fontWeight: '800', color: '#f1f5f9',
  },
  subtitle: {
    fontSize: '14px', color: '#64748b', marginLeft: '56px',
  },
  statsRow: { display: 'flex', gap: '12px', marginTop: '12px', marginLeft: '56px', flexWrap: 'wrap' },
  statBadge: (color) => ({
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: `${color}20`, color: color, border: `1px solid ${color}40`,
  }),
  headerRight: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.4)',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.10))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  tableWrapper: {
    borderRadius: '16px', border: '1px solid #334155',
    background: '#1e293b', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.5)',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #1e293b',
  },
  row: {
    cursor: 'pointer', transition: 'all 0.15s',
  },
  statusBadge: (status) => {
    const color = statusColors[status] || '#64748b';
    return {
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
    };
  },
  riskBadge: (level) => {
    const color = riskLevelColors[level] || '#64748b';
    return {
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
    };
  },
  typeBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '600', background: 'rgba(168,85,247,0.12)',
    color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)',
    textTransform: 'capitalize',
  },
  expiryWarning: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
    border: '1px solid rgba(245,158,11,0.3)', marginLeft: '8px',
  },
  emptyState: {
    padding: '60px 20px', textAlign: 'center',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '16px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px',
  },
  emptySub: {
    fontSize: '13px', color: '#64748b',
  },
};

const detailFields = [
  { key: 'title', label: 'Title' },
  {
    key: 'compliance_type', label: 'Compliance Type',
    render: (val) => <span style={styles.typeBadge}>{formatLabel(val)}</span>,
  },
  { key: 'entity_name', label: 'Entity Name' },
  { key: 'standard', label: 'Standard' },
  {
    key: 'status', label: 'Status',
    render: (val) => <span style={styles.statusBadge(val)}>{val || 'N/A'}</span>,
  },
  {
    key: 'risk_level', label: 'Risk Level',
    render: (val) => <span style={styles.riskBadge(val)}>{val || 'N/A'}</span>,
  },
  { key: 'auditor', label: 'Auditor' },
  {
    key: 'audit_date', label: 'Audit Date',
    render: (val) => formatDate(val),
  },
  {
    key: 'expiry_date', label: 'Expiry Date',
    render: (val) => (
      <span>
        {formatDate(val)}
        {isExpiringSoon(val) && (
          <span style={styles.expiryWarning}>Expiring Soon</span>
        )}
      </span>
    ),
  },
  { key: 'findings', label: 'Findings' },
  { key: 'corrective_action', label: 'Corrective Action' },
  {
    key: 'created_at', label: 'Created',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
  {
    key: 'updated_at', label: 'Last Updated',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
];

function Compliance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const entityOptions = [
    ...suppliers.map(s => s.name),
    ...warehouses.map(w => w.name),
  ];

  const formFields = [
    { key: 'title', label: 'Title', placeholder: 'Compliance record title', fullWidth: true },
    {
      key: 'compliance_type', label: 'Compliance Type', type: 'select',
      options: COMPLIANCE_TYPES,
    },
    { key: 'entity_name', label: 'Entity Name', type: 'select', options: entityOptions },
    { key: 'standard', label: 'Standard', placeholder: 'e.g. ISO 9001, GDPR' },
    {
      key: 'status', label: 'Status', type: 'select',
      options: STATUSES, defaultValue: 'pending',
    },
    {
      key: 'risk_level', label: 'Risk Level', type: 'select',
      options: RISK_LEVELS, defaultValue: 'low',
    },
    { key: 'auditor', label: 'Auditor', placeholder: 'Auditor name or firm' },
    { key: 'audit_date', label: 'Audit Date', type: 'date' },
    { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { key: 'findings', label: 'Findings', type: 'textarea', placeholder: 'Audit findings and observations...', fullWidth: true },
    { key: 'corrective_action', label: 'Corrective Action', type: 'textarea', placeholder: 'Required corrective actions...', fullWidth: true },
  ];

  const fetchRecords = async () => {
    try {
      const res = await API.get('/compliance');
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load compliance records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    API.get('/suppliers').then(res => setSuppliers(res.data)).catch(() => {});
    API.get('/warehouses').then(res => setWarehouses(res.data)).catch(() => {});
  }, []);

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setDetailOpen(false);
    setEditData(record);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this compliance record?')) return;
    try {
      await API.delete(`/compliance/${id}`);
      toast.success('Compliance record deleted');
      setDetailOpen(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (err) {
      toast.error('Failed to delete compliance record');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/compliance/${data.id}`, data);
        toast.success('Compliance record updated');
      } else {
        await API.post('/compliance', data);
        toast.success('Compliance record created');
      }
      setFormOpen(false);
      setEditData(null);
      fetchRecords();
    } catch (err) {
      toast.error('Failed to save compliance record');
      console.error(err);
    }
  };

  const handleAIAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze-compliance', {});
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

  const totalRecords = records.length;
  const passedCount = records.filter((r) => r.status === 'passed').length;
  const failedCount = records.filter((r) => r.status === 'failed').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const expiredCount = records.filter((r) => r.status === 'expired').length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              <FiFileText size={22} color="#fff" />
            </div>
            <div style={styles.title}>Compliance & Audit Tracking</div>
          </div>
          <div style={styles.subtitle}>
            Track compliance records, audit results, and certification statuses across your supply chain
          </div>
          <div style={styles.statsRow}>
            <span style={styles.statBadge('#3b82f6')}>{totalRecords} Total</span>
            <span style={styles.statBadge('#22c55e')}>{passedCount} Passed</span>
            <span style={styles.statBadge('#ef4444')}>{failedCount} Failed</span>
            <span style={styles.statBadge('#3b82f6')}>{pendingCount} Pending</span>
            <span style={styles.statBadge('#64748b')}>{expiredCount} Expired</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.aiBtn}
            onClick={handleAIAnalysis}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.20))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.10))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiCpu size={16} />
            AI Compliance Analysis
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FiPlus size={16} />
            New Record
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading compliance records...
          </div>
        ) : records.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiFileText size={28} color="#a855f7" />
            </div>
            <div style={styles.emptyTitle}>No Compliance Records</div>
            <div style={styles.emptySub}>
              Click "New Record" to add your first compliance record
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Entity</th>
                <th style={styles.th}>Standard</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  style={{
                    ...styles.row,
                    background: hoveredRow === record.id ? 'rgba(168,85,247,0.05)' : 'transparent',
                  }}
                  onClick={() => handleRowClick(record)}
                  onMouseEnter={() => setHoveredRow(record.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.title}
                    {isExpiringSoon(record.expiry_date) && (
                      <span style={styles.expiryWarning}>Expiring Soon</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{formatLabel(record.compliance_type)}</span>
                  </td>
                  <td style={{ ...styles.td, color: '#94a3b8' }}>
                    {record.entity_name || 'N/A'}
                  </td>
                  <td style={{ ...styles.td, color: '#94a3b8' }}>
                    {record.standard || 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(record.status)}>
                      {record.status || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.riskBadge(record.risk_level)}>
                      {record.risk_level || 'N/A'}
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
        onClose={() => { setDetailOpen(false); setSelectedRecord(null); }}
        title="Compliance Record Details"
        fields={detailFields}
        item={selectedRecord}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Compliance Record' : 'New Compliance Record'}
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
        title="AI Compliance Analysis"
      />
    </div>
  );
}

export default Compliance;
