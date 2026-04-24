import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiGrid, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const statusColors = {
  active: '#10b981',
  inactive: '#64748b',
  maintenance: '#eab308',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
};

const warehouseTypeLabels = {
  distribution: 'Distribution',
  fulfillment: 'Fulfillment',
  import_terminal: 'Import Terminal',
  storage: 'Storage',
  regional_hub: 'Regional Hub',
  cold_storage: 'Cold Storage',
  free_trade_zone: 'Free Trade Zone',
  cross_dock: 'Cross Dock',
  logistics_park: 'Logistics Park',
  ecommerce: 'E-Commerce',
  consolidation: 'Consolidation',
  automated: 'Automated',
  returns: 'Returns',
};

const formatNumber = (val) => {
  if (val == null || val === '') return 'N/A';
  return Number(val).toLocaleString();
};

const getUtilization = (used, capacity) => {
  if (!capacity || capacity === 0) return 0;
  return Math.round((used / capacity) * 100);
};

const getUtilizationColor = (pct) => {
  if (pct >= 80) return '#ef4444';
  if (pct >= 60) return '#eab308';
  return '#10b981';
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
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  statsRow: { display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' },
  statBadge: (color) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    background: `${color}18`, color: color, border: `1px solid ${color}30`,
  }),
  headerRight: { display: 'flex', gap: '12px', alignItems: 'center' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s',
  },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px',
    border: '1px solid rgba(139,92,246,0.3)',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.3s',
  },
  tableWrapper: {
    borderRadius: '16px', border: '1px solid #334155',
    background: '#1e293b', overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #334155', background: '#0f172a',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #334155',
  },
  row: {
    cursor: 'pointer', transition: 'background 0.2s',
  },
  statusBadge: (status) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: `${statusColors[status] || '#64748b'}18`,
    color: statusColors[status] || '#64748b',
    border: `1px solid ${statusColors[status] || '#64748b'}30`,
  }),
  typeBadge: {
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: 'rgba(20,184,166,0.12)', color: '#14b8a6',
    border: '1px solid rgba(20,184,166,0.25)',
  },
  tempBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
    border: '1px solid rgba(59,130,246,0.25)',
  },
  utilizationBar: {
    width: '100%', height: '8px', borderRadius: '4px',
    background: '#0f172a', overflow: 'hidden',
  },
  utilizationFill: (pct) => ({
    width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: '4px',
    background: getUtilizationColor(pct),
    transition: 'width 0.3s ease',
  }),
  emptyState: {
    padding: '60px 20px', textAlign: 'center',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: '#64748b' },
};

const detailFields = [
  { key: 'name', label: 'Warehouse Name' },
  { key: 'code', label: 'Code' },
  { key: 'location', label: 'Location' },
  { key: 'country', label: 'Country' },
  {
    key: 'capacity_sqft', label: 'Capacity',
    render: (val) => val != null ? `${formatNumber(val)} sq ft` : 'N/A',
  },
  {
    key: 'used_sqft', label: 'Used Space',
    render: (val) => val != null ? `${formatNumber(val)} sq ft` : 'N/A',
  },
  {
    key: 'utilization', label: 'Utilization',
    render: (val, item) => {
      const pct = getUtilization(item.used_sqft, item.capacity_sqft);
      const color = getUtilizationColor(pct);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ ...styles.utilizationBar, width: '120px' }}>
            <div style={styles.utilizationFill(pct)} />
          </div>
          <span style={{ color: color, fontWeight: '600', fontSize: '14px' }}>{pct}%</span>
        </div>
      );
    },
  },
  {
    key: 'warehouse_type', label: 'Warehouse Type',
    render: (val) => (
      <span style={styles.typeBadge}>
        {warehouseTypeLabels[val] || (val ? val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'N/A')}
      </span>
    ),
  },
  { key: 'manager_name', label: 'Manager Name' },
  { key: 'manager_email', label: 'Manager Email' },
  {
    key: 'temperature_controlled', label: 'Temperature Controlled',
    render: (val) => {
      if (val === true || val === 'true' || val === 'yes') {
        return <span style={styles.tempBadge}>&#10052; Yes</span>;
      }
      return <span style={{ color: '#64748b' }}>No</span>;
    },
  },
  {
    key: 'status', label: 'Status',
    render: (val) => (
      <span style={styles.statusBadge(val)}>{statusLabels[val] || val || 'N/A'}</span>
    ),
  },
];

const formFields = [
  { key: 'name', label: 'Warehouse Name', placeholder: 'e.g. Main Distribution Center' },
  { key: 'code', label: 'Code', placeholder: 'e.g. WH-001' },
  { key: 'location', label: 'Location', placeholder: 'e.g. Los Angeles, CA' },
  { key: 'country', label: 'Country', placeholder: 'e.g. United States' },
  { key: 'capacity_sqft', label: 'Capacity (sq ft)', type: 'number', placeholder: 'e.g. 50000' },
  { key: 'used_sqft', label: 'Used Space (sq ft)', type: 'number', placeholder: 'e.g. 30000' },
  {
    key: 'warehouse_type', label: 'Warehouse Type', type: 'select',
    options: [
      'distribution', 'fulfillment', 'import_terminal', 'storage', 'regional_hub',
      'cold_storage', 'free_trade_zone', 'cross_dock', 'logistics_park',
      'ecommerce', 'consolidation', 'automated', 'returns',
    ],
  },
  { key: 'manager_name', label: 'Manager Name', placeholder: 'e.g. John Smith' },
  { key: 'manager_email', label: 'Manager Email', type: 'email', placeholder: 'e.g. john@example.com' },
  {
    key: 'temperature_controlled', label: 'Temperature Controlled', type: 'select',
    options: ['yes', 'no'],
  },
  {
    key: 'status', label: 'Status', type: 'select',
    options: ['active', 'inactive', 'maintenance'],
  },
];

function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const fetchWarehouses = async () => {
    try {
      const res = await API.get('/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      toast.error('Failed to load warehouses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleRowClick = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (warehouse) => {
    setDetailOpen(false);
    setEditData(warehouse);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await API.delete(`/warehouses/${id}`);
      toast.success('Warehouse deleted successfully');
      setDetailOpen(false);
      setSelectedWarehouse(null);
      fetchWarehouses();
    } catch (err) {
      toast.error('Failed to delete warehouse');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    try {
      const payload = {
        ...data,
        capacity_sqft: Number(data.capacity_sqft),
        used_sqft: Number(data.used_sqft),
        temperature_controlled: data.temperature_controlled === 'yes' || data.temperature_controlled === true,
      };
      if (data.id) {
        await API.put(`/warehouses/${data.id}`, payload);
        toast.success('Warehouse updated successfully');
      } else {
        await API.post('/warehouses', payload);
        toast.success('Warehouse created successfully');
      }
      setFormOpen(false);
      setEditData(null);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save warehouse');
      console.error(err);
    }
  };

  const runAIOptimization = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/optimize-warehouse', {});
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

  const totalWarehouses = warehouses.length;
  const activeCount = warehouses.filter((w) => w.status === 'active').length;
  const maintenanceCount = warehouses.filter((w) => w.status === 'maintenance').length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <div style={styles.titleIcon}>
              <FiGrid size={22} color="#fff" />
            </div>
            Warehouse Management
          </div>
          <div style={styles.subtitle}>
            Manage warehouse locations, monitor capacity utilization, and optimize operations
          </div>
          <div style={styles.statsRow}>
            <span style={styles.statBadge('#f1f5f9')}>{totalWarehouses} Total</span>
            <span style={styles.statBadge('#10b981')}>{activeCount} Active</span>
            <span style={styles.statBadge('#eab308')}>{maintenanceCount} Maintenance</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.aiBtn}
            onClick={runAIOptimization}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiCpu size={16} /> AI Optimize
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(20,184,166,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FiPlus size={16} /> New Warehouse
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading warehouses...
          </div>
        ) : warehouses.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiGrid size={28} color="#14b8a6" />
            </div>
            <div style={styles.emptyTitle}>No Warehouses Found</div>
            <div style={styles.emptySub}>Click "New Warehouse" to add your first warehouse</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Utilization</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => {
                const pct = getUtilization(warehouse.used_sqft, warehouse.capacity_sqft);
                const utilizationColor = getUtilizationColor(pct);
                return (
                  <tr
                    key={warehouse.id}
                    style={styles.row}
                    onClick={() => handleRowClick(warehouse)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>
                      {warehouse.name}
                      {(warehouse.temperature_controlled === true || warehouse.temperature_controlled === 'true' || warehouse.temperature_controlled === 'yes') && (
                        <span style={{ marginLeft: '8px', color: '#3b82f6', fontSize: '13px' }}>&#10052;</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', color: '#94a3b8' }}>
                      {warehouse.code}
                    </td>
                    <td style={styles.td}>{warehouse.location}</td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>
                        {warehouseTypeLabels[warehouse.warehouse_type] || warehouse.warehouse_type || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
                        <div style={{ ...styles.utilizationBar, flex: 1 }}>
                          <div style={styles.utilizationFill(pct)} />
                        </div>
                        <span style={{ color: utilizationColor, fontWeight: '600', fontSize: '13px', minWidth: '36px' }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(warehouse.status)}>
                        {statusLabels[warehouse.status] || warehouse.status || 'N/A'}
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
        onClose={() => { setDetailOpen(false); setSelectedWarehouse(null); }}
        title={selectedWarehouse ? `Warehouse: ${selectedWarehouse.name}` : 'Warehouse Details'}
        fields={detailFields}
        item={selectedWarehouse}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Warehouse' : 'New Warehouse'}
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
        title="AI Warehouse Optimization"
      />
    </div>
  );
}

export default Warehouses;
