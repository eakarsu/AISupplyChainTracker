import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiTruck, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const statusColors = {
  pending: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'rgba(234,179,8,0.3)' },
  in_transit: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  delivered: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  delayed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
};

const priorityColors = {
  low: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  medium: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  high: { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  critical: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
};

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' },
  titleIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
    display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
  }),
  emptyState: {
    padding: '60px 20px', textAlign: 'center',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: '#64748b' },
};

// formFields moved inside component for dynamic warehouse options

const detailFields = [
  { key: 'tracking_number', label: 'Tracking Number' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  { key: 'carrier', label: 'Carrier' },
  {
    key: 'status', label: 'Status',
    render: (val) => {
      const c = statusColors[val] || statusColors.pending;
      return (
        <span style={styles.badge(c)}>
          {val ? val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'N/A'}
        </span>
      );
    },
  },
  {
    key: 'priority', label: 'Priority',
    render: (val) => {
      const c = priorityColors[val] || priorityColors.low;
      return (
        <span style={styles.badge(c)}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A'}
        </span>
      );
    },
  },
  {
    key: 'shipment_type', label: 'Shipment Type',
    render: (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'N/A',
  },
  { key: 'weight_kg', label: 'Weight (kg)', render: (val) => val ? `${Number(val).toLocaleString()} kg` : 'N/A' },
  {
    key: 'estimated_delivery', label: 'Estimated Delivery',
    render: (val) => val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
  },
  { key: 'current_location', label: 'Current Location' },
  {
    key: 'created_at', label: 'Created',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
  {
    key: 'updated_at', label: 'Last Updated',
    render: (val) => val ? new Date(val).toLocaleString() : 'N/A',
  },
];

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  const warehouseLocations = warehouses.map(w => w.location).filter(Boolean);

  const formFields = [
    { key: 'tracking_number', label: 'Tracking Number', placeholder: 'e.g. SHP-2026-001' },
    { key: 'origin', label: 'Origin', type: 'select', options: warehouseLocations },
    { key: 'destination', label: 'Destination', type: 'select', options: warehouseLocations },
    { key: 'carrier', label: 'Carrier', placeholder: 'e.g. Maersk' },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_transit', 'delivered', 'delayed'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { key: 'shipment_type', label: 'Shipment Type', type: 'select', options: ['sea_freight', 'air_freight', 'truck', 'rail'] },
    { key: 'weight_kg', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 1500', step: '0.01' },
    { key: 'estimated_delivery', label: 'Estimated Delivery', type: 'date' },
    { key: 'current_location', label: 'Current Location', placeholder: 'e.g. Pacific Ocean', fullWidth: true },
  ];

  const fetchShipments = async () => {
    try {
      const res = await API.get('/shipments');
      setShipments(res.data);
    } catch (err) {
      toast.error('Failed to load shipments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    API.get('/warehouses').then(res => setWarehouses(res.data)).catch(() => {});
  }, []);

  const handleRowClick = async (shipment) => {
    try {
      const res = await API.get(`/shipments/${shipment.id}`);
      setSelectedShipment(res.data);
      setDetailOpen(true);
    } catch (err) {
      toast.error('Failed to load shipment details');
    }
  };

  const handleNew = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (shipment) => {
    setDetailOpen(false);
    setEditData(shipment);
    setFormOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/shipments/${data.id}`, data);
        toast.success('Shipment updated successfully');
      } else {
        await API.post('/shipments', data);
        toast.success('Shipment created successfully');
      }
      setFormOpen(false);
      setEditData(null);
      fetchShipments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save shipment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    try {
      await API.delete(`/shipments/${id}`);
      toast.success('Shipment deleted successfully');
      setDetailOpen(false);
      setSelectedShipment(null);
      fetchShipments();
    } catch (err) {
      toast.error('Failed to delete shipment');
    }
  };

  const runAIAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/predict-disruption', { shipments });
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

  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <div style={styles.titleIcon}>
              <FiTruck size={22} color="#fff" />
            </div>
            Shipment Tracking
          </div>
          <div style={styles.subtitle}>
            Monitor and manage all shipments across your supply chain
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
            <FiCpu size={16} /> AI Analysis
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
            <FiPlus size={16} /> New Shipment
          </button>
        </div>
      </div>

      {/* Status Counts */}
      <div style={styles.statsRow}>
        <div style={styles.statBadge('#f1f5f9')}>
          Total: {shipments.length}
        </div>
        {statusCounts.pending > 0 && (
          <div style={styles.statBadge('#eab308')}>
            Pending: {statusCounts.pending}
          </div>
        )}
        {statusCounts.in_transit > 0 && (
          <div style={styles.statBadge('#3b82f6')}>
            In Transit: {statusCounts.in_transit}
          </div>
        )}
        {statusCounts.delivered > 0 && (
          <div style={styles.statBadge('#22c55e')}>
            Delivered: {statusCounts.delivered}
          </div>
        )}
        {statusCounts.delayed > 0 && (
          <div style={styles.statBadge('#ef4444')}>
            Delayed: {statusCounts.delayed}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiTruck size={28} color="#3b82f6" />
            </div>
            <div style={styles.emptyTitle}>No Shipments Found</div>
            <div style={styles.emptySub}>Create your first shipment to get started</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tracking Number</th>
                <th style={styles.th}>Origin</th>
                <th style={styles.th}>Destination</th>
                <th style={styles.th}>Carrier</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  style={styles.row}
                  onClick={() => handleRowClick(shipment)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b80'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>
                    {shipment.tracking_number}
                  </td>
                  <td style={styles.td}>{shipment.origin}</td>
                  <td style={styles.td}>{shipment.destination}</td>
                  <td style={styles.td}>{shipment.carrier}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(statusColors[shipment.status] || statusColors.pending)}>
                      {shipment.status
                        ? shipment.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                        : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(priorityColors[shipment.priority] || priorityColors.low)}>
                      {shipment.priority
                        ? shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)
                        : 'Low'}
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
        onClose={() => { setDetailOpen(false); setSelectedShipment(null); }}
        title={selectedShipment ? `Shipment: ${selectedShipment.tracking_number}` : 'Shipment Details'}
        fields={detailFields}
        item={selectedShipment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        title={editData?.id ? 'Edit Shipment' : 'New Shipment'}
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
        title="Shipment Disruption Prediction"
      />
    </div>
  );
}

export default Shipments;
