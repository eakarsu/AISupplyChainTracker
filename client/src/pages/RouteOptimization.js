import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiMap, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // Header
  header: {
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  routeCount: {
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'rgba(6,182,212,0.12)',
    border: '1px solid rgba(6,182,212,0.25)',
    fontSize: '13px',
    fontWeight: '600',
    color: '#06b6d4',
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
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Table container
  tableWrap: {
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
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    borderBottom: '1px solid #334155',
    background: 'rgba(15,23,42,0.5)',
  },
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#e2e8f0',
    borderBottom: '1px solid #1e293b',
  },
  row: {
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(6,182,212,0.1)',
    border: '1px solid rgba(6,182,212,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#475569',
  },

  // Loading
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #334155',
    borderTopColor: '#06b6d4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Transport badges
  badge: (bg, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: bg,
    fontSize: '12px',
    fontWeight: '600',
    color: color,
    textTransform: 'capitalize',
  }),

  // Status badges
  statusBadge: (bg, color) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    background: bg,
    fontSize: '12px',
    fontWeight: '600',
    color: color,
    textTransform: 'capitalize',
  }),

  // Reliability bar
  reliabilityWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  reliabilityBar: {
    flex: 1,
    maxWidth: '80px',
    height: '6px',
    borderRadius: '3px',
    background: '#0f172a',
    overflow: 'hidden',
  },
  reliabilityFill: (score) => ({
    width: `${(score / 10) * 100}%`,
    height: '100%',
    borderRadius: '3px',
    background:
      score >= 8
        ? 'linear-gradient(90deg, #10b981, #34d399)'
        : score >= 5
        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
        : 'linear-gradient(90deg, #ef4444, #f87171)',
  }),
  reliabilityText: (score) => ({
    fontSize: '13px',
    fontWeight: '700',
    color: score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444',
    minWidth: '28px',
  }),
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSPORT_CONFIG = {
  sea: { icon: '\u26F5', bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  air: { icon: '\u2708\uFE0F', bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
  truck: { icon: '\uD83D\uDE9A', bg: 'rgba(249,115,22,0.12)', color: '#fb923c' },
  rail: { icon: '\uD83D\uDE82', bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
};

const STATUS_CONFIG = {
  active: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  inactive: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
  suspended: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
};

const formFields = [
  { key: 'route_name', label: 'Route Name', type: 'text', placeholder: 'e.g. Shanghai - Rotterdam Express', fullWidth: true },
  { key: 'origin', label: 'Origin', type: 'text', placeholder: 'e.g. Shanghai, China' },
  { key: 'destination', label: 'Destination', type: 'text', placeholder: 'e.g. Rotterdam, Netherlands' },
  { key: 'transport_mode', label: 'Transport Mode', type: 'select', options: ['sea', 'air', 'truck', 'rail'] },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'] },
  { key: 'distance_km', label: 'Distance (km)', type: 'number', placeholder: '0', step: '1' },
  { key: 'estimated_hours', label: 'Estimated Hours', type: 'number', placeholder: '0', step: '0.5' },
  { key: 'cost_per_kg', label: 'Cost per kg ($)', type: 'number', placeholder: '0.00', step: '0.01' },
  { key: 'carbon_emission_kg', label: 'Carbon Emission (kg)', type: 'number', placeholder: '0', step: '0.1' },
  { key: 'reliability_score', label: 'Reliability Score (0-10)', type: 'number', placeholder: '0', step: '0.1' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDistance(val) {
  if (val == null) return 'N/A';
  return Number(val).toLocaleString() + ' km';
}

function formatCurrency(val) {
  if (val == null) return 'N/A';
  return '$' + Number(val).toFixed(2);
}

function renderTransportBadge(mode) {
  const cfg = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.truck;
  return (
    <span style={styles.badge(cfg.bg, cfg.color)}>
      <span>{cfg.icon}</span>
      {mode}
    </span>
  );
}

function renderStatusBadge(status) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return <span style={styles.statusBadge(cfg.bg, cfg.color)}>{status}</span>;
}

function renderReliability(score) {
  const s = Number(score) || 0;
  return (
    <div style={styles.reliabilityWrap}>
      <span style={styles.reliabilityText(s)}>{s.toFixed(1)}</span>
      <div style={styles.reliabilityBar}>
        <div style={styles.reliabilityFill(s)} />
      </div>
    </div>
  );
}

// Detail modal field definitions
const detailFields = [
  { key: 'route_name', label: 'Route Name' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  { key: 'transport_mode', label: 'Transport Mode', render: (v) => renderTransportBadge(v) },
  { key: 'status', label: 'Status', render: (v) => renderStatusBadge(v) },
  { key: 'distance_km', label: 'Distance', render: (v) => formatDistance(v) },
  { key: 'estimated_hours', label: 'Estimated Hours', render: (v) => (v != null ? `${v} hrs` : 'N/A') },
  { key: 'cost_per_kg', label: 'Cost per kg', render: (v) => formatCurrency(v) },
  { key: 'carbon_emission_kg', label: 'Carbon Emission', render: (v) => (v != null ? `${Number(v).toLocaleString()} kg CO2` : 'N/A') },
  { key: 'reliability_score', label: 'Reliability Score', render: (v) => renderReliability(v) },
  { key: 'created_at', label: 'Created', render: (v) => (v ? new Date(v).toLocaleDateString() : 'N/A') },
  { key: 'updated_at', label: 'Last Updated', render: (v) => (v ? new Date(v).toLocaleDateString() : 'N/A') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RouteOptimization() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // AI panel
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchRoutes = async () => {
    try {
      const res = await API.get('/routes');
      setRoutes(res.data);
    } catch (err) {
      toast.error('Failed to load routes: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleCreate = async (data) => {
    try {
      await API.post('/routes', data);
      toast.success('Route created successfully');
      setFormOpen(false);
      setEditingRoute(null);
      fetchRoutes();
    } catch (err) {
      toast.error('Failed to create route: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (data) => {
    try {
      await API.put(`/routes/${data.id}`, data);
      toast.success('Route updated successfully');
      setFormOpen(false);
      setEditingRoute(null);
      setDetailOpen(false);
      setSelectedRoute(null);
      fetchRoutes();
    } catch (err) {
      toast.error('Failed to update route: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await API.delete(`/routes/${id}`);
      toast.success('Route deleted successfully');
      setDetailOpen(false);
      setSelectedRoute(null);
      fetchRoutes();
    } catch (err) {
      toast.error('Failed to delete route: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = (data) => {
    if (data.id) {
      handleUpdate(data);
    } else {
      handleCreate(data);
    }
  };

  // -----------------------------------------------------------------------
  // Row click -> detail
  // -----------------------------------------------------------------------

  const handleRowClick = (route) => {
    setSelectedRoute(route);
    setDetailOpen(true);
  };

  // -----------------------------------------------------------------------
  // Detail -> edit
  // -----------------------------------------------------------------------

  const handleEdit = (route) => {
    setDetailOpen(false);
    setEditingRoute(route);
    setFormOpen(true);
  };

  // -----------------------------------------------------------------------
  // New route
  // -----------------------------------------------------------------------

  const handleNew = () => {
    setEditingRoute(null);
    setFormOpen(true);
  };

  // -----------------------------------------------------------------------
  // AI analysis
  // -----------------------------------------------------------------------

  const handleAIOptimize = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/optimize-route', {});
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

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FiMap size={26} color="#fff" />
          </div>
          <div>
            <div style={styles.title}>Route Optimization</div>
            <div style={styles.subtitle}>Manage and optimize your shipping routes with AI-powered analysis</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.routeCount}>{routes.length} Route{routes.length !== 1 ? 's' : ''}</span>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiPlus size={16} /> New Route
          </button>
          <button
            style={styles.aiBtn}
            onClick={handleAIOptimize}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiCpu size={16} /> AI Optimize
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading routes...</div>
          </div>
        ) : routes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiMap size={28} color="#06b6d4" />
            </div>
            <div style={styles.emptyTitle}>No routes found</div>
            <div style={styles.emptySub}>Create your first shipping route to get started</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Route Name</th>
                <th style={styles.th}>Origin</th>
                <th style={styles.th}>Destination</th>
                <th style={styles.th}>Mode</th>
                <th style={styles.th}>Distance</th>
                <th style={styles.th}>Cost / kg</th>
                <th style={styles.th}>Reliability</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr
                  key={route.id}
                  style={styles.row}
                  onClick={() => handleRowClick(route)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>{route.route_name}</td>
                  <td style={styles.td}>{route.origin}</td>
                  <td style={styles.td}>{route.destination}</td>
                  <td style={styles.td}>{renderTransportBadge(route.transport_mode)}</td>
                  <td style={styles.td}>{formatDistance(route.distance_km)}</td>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>{formatCurrency(route.cost_per_kg)}</td>
                  <td style={styles.td}>{renderReliability(route.reliability_score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedRoute(null); }}
        title={selectedRoute?.route_name || 'Route Details'}
        fields={detailFields}
        item={selectedRoute}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingRoute(null); }}
        title={editingRoute ? 'Edit Route' : 'New Route'}
        fields={formFields}
        initialData={editingRoute}
        onSave={handleSave}
      />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Route Optimization"
      />
    </div>
  );
}

export default RouteOptimization;
