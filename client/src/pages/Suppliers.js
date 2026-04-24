import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiUsers, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    marginBottom: '32px', display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' },
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
  riskBadge: (score) => {
    let color = '#22c55e';
    if (score >= 8) color = '#ef4444';
    else if (score >= 6) color = '#f97316';
    else if (score >= 3) color = '#eab308';
    return {
      padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
      display: 'inline-block',
    };
  },
  complianceBadge: (status) => {
    const colors = {
      compliant: '#22c55e',
      under_review: '#eab308',
      non_compliant: '#ef4444',
    };
    const color = colors[status] || '#64748b';
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

const formatComplianceLabel = (status) => {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ');
};

const formatCurrency = (value) => {
  if (value == null || value === '') return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const detailFields = [
  { key: 'name', label: 'Supplier Name' },
  { key: 'country', label: 'Country' },
  { key: 'category', label: 'Category' },
  { key: 'risk_score', label: 'Risk Score', render: (val) => (
    <span style={styles.riskBadge(val)}>{val != null ? `${val} / 10` : 'N/A'}</span>
  )},
  { key: 'reliability_rating', label: 'Reliability Rating', render: (val) => (
    <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{val != null ? `${val} / 10` : 'N/A'}</span>
  )},
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'lead_time_days', label: 'Lead Time (Days)' },
  { key: 'annual_revenue', label: 'Annual Revenue', render: (val) => formatCurrency(val) },
  { key: 'compliance_status', label: 'Compliance Status', render: (val) => (
    <span style={styles.complianceBadge(val)}>{formatComplianceLabel(val)}</span>
  )},
];

const formFields = [
  { key: 'name', label: 'Supplier Name', placeholder: 'Enter supplier name' },
  { key: 'country', label: 'Country', placeholder: 'e.g. United States' },
  { key: 'category', label: 'Category', placeholder: 'e.g. Electronics, Raw Materials' },
  { key: 'risk_score', label: 'Risk Score (0-10)', type: 'number', placeholder: '0', step: '0.1' },
  { key: 'reliability_rating', label: 'Reliability Rating (0-10)', type: 'number', placeholder: '0', step: '0.1' },
  { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'supplier@example.com' },
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+1 555-000-0000' },
  { key: 'lead_time_days', label: 'Lead Time (Days)', type: 'number', placeholder: '0' },
  { key: 'annual_revenue', label: 'Annual Revenue ($)', type: 'number', placeholder: '0' },
  { key: 'compliance_status', label: 'Compliance Status', type: 'select', options: ['compliant', 'under_review', 'non_compliant'] },
];

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to load suppliers');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleRowClick = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetail(true);
  };

  const handleNew = () => {
    setEditingSupplier(null);
    setShowForm(true);
  };

  const handleEdit = (supplier) => {
    setShowDetail(false);
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted successfully');
      setShowDetail(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete supplier');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/suppliers/${data.id}`, data);
        toast.success('Supplier updated successfully');
      } else {
        await API.post('/suppliers', data);
        toast.success('Supplier created successfully');
      }
      setShowForm(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(data.id ? 'Failed to update supplier' : 'Failed to create supplier');
      console.error(err);
    }
  };

  const runAIAnalysis = async () => {
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

  const totalSuppliers = suppliers.length;
  const highRiskCount = suppliers.filter((s) => s.risk_score >= 6).length;
  const compliantCount = suppliers.filter((s) => s.compliance_status === 'compliant').length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <FiUsers size={28} color="#10b981" />
            Supplier Management
          </div>
          <div style={styles.subtitle}>
            Manage your suppliers, monitor risk scores, and run AI-powered assessments
          </div>
          <div style={styles.statsRow}>
            <span style={styles.statBadge('#3b82f6')}>{totalSuppliers} Total</span>
            <span style={styles.statBadge('#ef4444')}>{highRiskCount} High Risk</span>
            <span style={styles.statBadge('#22c55e')}>{compliantCount} Compliant</span>
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
            AI Risk Assessment
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiPlus size={16} />
            New Supplier
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Supplier Name</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Risk Score</th>
              <th style={styles.th}>Reliability</th>
              <th style={styles.th}>Compliance</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.empty}>
                  No suppliers found. Click "New Supplier" to add one.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  style={styles.row}
                  onClick={() => handleRowClick(supplier)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>{supplier.name}</td>
                  <td style={styles.td}>{supplier.country}</td>
                  <td style={styles.td}>{supplier.category}</td>
                  <td style={styles.td}>
                    <span style={styles.riskBadge(supplier.risk_score)}>
                      {supplier.risk_score != null ? supplier.risk_score : 'N/A'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {supplier.reliability_rating != null ? `${supplier.reliability_rating} / 10` : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.complianceBadge(supplier.compliance_status)}>
                      {formatComplianceLabel(supplier.compliance_status)}
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
        onClose={() => { setShowDetail(false); setSelectedSupplier(null); }}
        title="Supplier Details"
        fields={detailFields}
        item={selectedSupplier}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingSupplier(null); }}
        title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}
        fields={formFields}
        initialData={editingSupplier}
        onSave={handleSave}
      />

      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="Supplier Risk Assessment"
      />
    </div>
  );
}

export default Suppliers;
