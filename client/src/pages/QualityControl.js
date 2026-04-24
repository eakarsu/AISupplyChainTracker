import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const resultColors = {
  pass: '#10b981',
  fail: '#ef4444',
  conditional: '#eab308',
  pending: '#3b82f6',
};

const resultLabels = {
  pass: 'Pass',
  fail: 'Fail',
  conditional: 'Conditional',
  pending: 'Pending',
};

const typeColors = {
  incoming: '#3b82f6',
  in_process: '#8b5cf6',
  final: '#10b981',
  random: '#f97316',
};

const typeLabels = {
  incoming: 'Incoming',
  in_process: 'In Process',
  final: 'Final',
  random: 'Random',
};

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    marginBottom: '32px', display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: {
    fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  subtitle: { fontSize: '14px', color: '#64748b' },
  headerRight: { display: 'flex', gap: '12px', alignItems: 'center' },
  newBtn: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s',
  },
  aiBtn: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s',
  },
  statsRow: { display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' },
  statBadge: (color) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    background: `${color}18`, color: color, border: `1px solid ${color}30`,
  }),
  tableWrapper: {
    borderRadius: '16px', border: '1px solid #334155',
    background: '#1e293b', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #334155', background: '#0f172a',
  },
  td: {
    padding: '14px 20px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #334155',
  },
  row: {
    cursor: 'pointer', transition: 'all 0.2s',
  },
  resultBadge: (result) => {
    const color = resultColors[result] || '#64748b';
    return {
      padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
      display: 'inline-block', textTransform: 'capitalize',
    };
  },
  typeBadge: (type) => {
    const color = typeColors[type] || '#64748b';
    return {
      padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
      display: 'inline-block', textTransform: 'capitalize',
    };
  },
  empty: {
    padding: '60px 20px', textAlign: 'center', color: '#475569', fontSize: '14px',
  },
};

const getDefectRateColor = (rate) => {
  const num = parseFloat(rate) || 0;
  if (num === 0) return '#10b981';
  if (num <= 2) return '#eab308';
  return '#ef4444';
};

const detailFields = [
  { key: 'inspection_number', label: 'Inspection Number' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'supplier_name', label: 'Supplier Name' },
  { key: 'batch_number', label: 'Batch Number' },
  { key: 'inspection_type', label: 'Inspection Type', render: (val) => (
    <span style={styles.typeBadge(val)}>{typeLabels[val] || val || 'N/A'}</span>
  )},
  { key: 'result', label: 'Result', render: (val) => (
    <span style={styles.resultBadge(val)}>{resultLabels[val] || val || 'N/A'}</span>
  )},
  { key: 'defects_found', label: 'Defects Found', render: (val) => (
    <span style={{ color: Number(val) > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
      {val != null ? val : 'N/A'}
    </span>
  )},
  { key: 'defect_rate', label: 'Defect Rate', render: (val) => (
    <span style={{ color: getDefectRateColor(val), fontWeight: '600' }}>
      {val != null ? `${val}%` : 'N/A'}
    </span>
  )},
  { key: 'inspector', label: 'Inspector' },
  { key: 'inspection_date', label: 'Inspection Date', render: (val) => (
    val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  )},
  { key: 'notes', label: 'Notes', render: (val) => val || 'No notes' },
];

function QualityControl() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInspection, setEditingInspection] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);

  const fetchInspections = async () => {
    try {
      const res = await API.get('/quality');
      setInspections(res.data);
    } catch (err) {
      toast.error('Failed to load quality inspections');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInspections();
    API.get('/suppliers').then(res => setSuppliers(res.data));
    API.get('/inventory').then(res => setInventory(res.data));
  }, []);

  const formFields = [
    { key: 'inspection_number', label: 'Inspection Number', placeholder: 'e.g. QC-2026-001' },
    { key: 'product_name', label: 'Product Name', type: 'select', options: inventory.map(i => i.product_name) },
    { key: 'supplier_name', label: 'Supplier Name', type: 'select', options: suppliers.map(s => s.name) },
    { key: 'batch_number', label: 'Batch Number', placeholder: 'e.g. BATCH-001' },
    { key: 'inspection_type', label: 'Inspection Type', type: 'select', options: ['incoming', 'in_process', 'final', 'random'] },
    { key: 'result', label: 'Result', type: 'select', options: ['pass', 'fail', 'conditional', 'pending'] },
    { key: 'defects_found', label: 'Defects Found', type: 'number', placeholder: '0', step: '1' },
    { key: 'defect_rate', label: 'Defect Rate (%)', type: 'number', placeholder: '0.00', step: '0.01' },
    { key: 'inspector', label: 'Inspector', placeholder: 'Enter inspector name' },
    { key: 'inspection_date', label: 'Inspection Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', fullWidth: true },
  ];

  const handleRowClick = (inspection) => {
    setSelectedInspection(inspection);
    setShowDetail(true);
  };

  const handleNew = () => {
    setEditingInspection(null);
    setShowForm(true);
  };

  const handleEdit = (inspection) => {
    setShowDetail(false);
    setEditingInspection(inspection);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return;
    try {
      await API.delete(`/quality/${id}`);
      toast.success('Inspection deleted successfully');
      setShowDetail(false);
      setSelectedInspection(null);
      fetchInspections();
    } catch (err) {
      toast.error('Failed to delete inspection');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    const payload = {
      ...data,
      defects_found: Number(data.defects_found),
      defect_rate: Number(data.defect_rate),
    };

    try {
      if (data.id) {
        await API.put(`/quality/${data.id}`, payload);
        toast.success('Inspection updated successfully');
      } else {
        await API.post('/quality', payload);
        toast.success('Inspection created successfully');
      }
      setShowForm(false);
      setEditingInspection(null);
      fetchInspections();
    } catch (err) {
      toast.error(data.id ? 'Failed to update inspection' : 'Failed to create inspection');
      console.error(err);
    }
  };

  const runAIAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze-quality', {});
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

  const totalInspections = inspections.length;
  const passCount = inspections.filter((i) => i.result === 'pass').length;
  const passRate = totalInspections > 0 ? ((passCount / totalInspections) * 100).toFixed(1) : '0.0';
  const failCount = inspections.filter((i) => i.result === 'fail').length;
  const pendingCount = inspections.filter((i) => i.result === 'pending').length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
            }}>
              <FiCheckCircle size={22} color="#fff" />
            </span>
            Quality Control
          </div>
          <div style={styles.subtitle}>
            Manage quality inspections, track defect rates, and run AI-powered quality analysis
          </div>
          <div style={styles.statsRow}>
            <span style={styles.statBadge('#22d3ee')}>{totalInspections} Inspections</span>
            <span style={styles.statBadge('#10b981')}>{passRate}% Pass Rate</span>
            <span style={styles.statBadge('#ef4444')}>{failCount} Failed</span>
            <span style={styles.statBadge('#3b82f6')}>{pendingCount} Pending</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.aiBtn}
            onClick={runAIAnalysis}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiCpu size={16} />
            AI Quality Analysis
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiPlus size={16} />
            New Inspection
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Inspection #</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Supplier</th>
              <th style={styles.th}>Result</th>
              <th style={styles.th}>Defects Found</th>
              <th style={styles.th}>Defect Rate</th>
              <th style={styles.th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.empty}>
                  No quality inspections found. Click "New Inspection" to create one.
                </td>
              </tr>
            ) : (
              inspections.map((inspection) => (
                <tr
                  key={inspection.id}
                  style={styles.row}
                  onClick={() => handleRowClick(inspection)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>
                    {inspection.inspection_number}
                  </td>
                  <td style={styles.td}>{inspection.product_name}</td>
                  <td style={styles.td}>{inspection.supplier_name}</td>
                  <td style={styles.td}>
                    <span style={styles.resultBadge(inspection.result)}>
                      {resultLabels[inspection.result] || inspection.result || 'N/A'}
                    </span>
                  </td>
                  <td style={{
                    ...styles.td, fontWeight: '600',
                    color: Number(inspection.defects_found) > 0 ? '#ef4444' : '#10b981',
                  }}>
                    {inspection.defects_found != null ? inspection.defects_found : 'N/A'}
                  </td>
                  <td style={{
                    ...styles.td, fontWeight: '600',
                    color: getDefectRateColor(inspection.defect_rate),
                  }}>
                    {inspection.defect_rate != null ? `${inspection.defect_rate}%` : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge(inspection.inspection_type)}>
                      {typeLabels[inspection.inspection_type] || inspection.inspection_type || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedInspection(null); }}
        title="Quality Inspection Details"
        fields={detailFields}
        item={selectedInspection}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingInspection(null); }}
        title={editingInspection ? 'Edit Inspection' : 'New Inspection'}
        fields={formFields}
        initialData={editingInspection}
        onSave={handleSave}
      />

      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Quality Analysis"
      />
    </div>
  );
}

export default QualityControl;
