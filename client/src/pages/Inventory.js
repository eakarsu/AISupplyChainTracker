import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPackage, FiPlus, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const statusColors = {
  in_stock: '#10b981',
  low_stock: '#f59e0b',
  critical: '#ef4444',
  out_of_stock: '#64748b',
};

const statusLabels = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  critical: 'Critical',
  out_of_stock: 'Out of Stock',
};

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: {},
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#64748b', marginBottom: '12px' },
  counts: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  countBadge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: `${color}18`, color: color, border: `1px solid ${color}30`,
  }),
  headerRight: { display: 'flex', gap: '12px', alignItems: 'center' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s',
  },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.3)',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s',
  },
  tableWrapper: {
    background: '#1e293b', borderRadius: '16px', border: '1px solid #334155',
    overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #334155', background: '#0f172a',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#e2e8f0',
    borderBottom: '1px solid #1e293b',
  },
  tr: {
    cursor: 'pointer', transition: 'background 0.2s',
  },
  statusBadge: (status) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
    background: `${statusColors[status] || '#64748b'}18`,
    color: statusColors[status] || '#64748b',
    border: `1px solid ${statusColors[status] || '#64748b'}30`,
  }),
  emptyState: {
    padding: '60px 24px', textAlign: 'center',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: '#64748b' },
};

const detailFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity', render: (val, item) => (
    <span style={{ color: val < item.reorder_point ? '#ef4444' : '#e2e8f0', fontWeight: '600' }}>
      {val}
    </span>
  )},
  { key: 'unit_price', label: 'Unit Price', render: (val) => `$${Number(val).toFixed(2)}` },
  { key: 'warehouse_location', label: 'Warehouse Location' },
  { key: 'reorder_point', label: 'Reorder Point' },
  { key: 'supplier_id', label: 'Supplier ID' },
  { key: 'last_restocked', label: 'Last Restocked', render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
  { key: 'status', label: 'Status', render: (val) => (
    <span style={styles.statusBadge(val)}>{statusLabels[val] || val}</span>
  )},
];

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchItems = async () => {
    try {
      const res = await API.get('/inventory');
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    API.get('/suppliers').then(res => setSuppliers(res.data));
  }, []);

  const formFields = [
    { key: 'sku', label: 'SKU', placeholder: 'e.g. SKU-001' },
    { key: 'product_name', label: 'Product Name', placeholder: 'e.g. Widget A' },
    { key: 'category', label: 'Category', placeholder: 'e.g. Electronics' },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
    { key: 'unit_price', label: 'Unit Price ($)', type: 'number', placeholder: '0.00', step: '0.01' },
    { key: 'warehouse_location', label: 'Warehouse Location', placeholder: 'e.g. Warehouse A' },
    { key: 'reorder_point', label: 'Reorder Point', type: 'number', placeholder: '0' },
    { key: 'supplier_id', label: 'Supplier', type: 'select', options: suppliers.map(s => ({ label: s.name, value: s.id })) },
    { key: 'last_restocked', label: 'Last Restocked', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['in_stock', 'low_stock', 'critical', 'out_of_stock'] },
  ];

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleEdit = (item) => {
    setDetailOpen(false);
    setEditItem(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await API.delete(`/inventory/${id}`);
      toast.success('Item deleted');
      setDetailOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleSave = async (data) => {
    try {
      const payload = {
        ...data,
        quantity: Number(data.quantity),
        unit_price: Number(data.unit_price),
        reorder_point: Number(data.reorder_point),
        supplier_id: Number(data.supplier_id),
      };
      if (data.id) {
        await API.put(`/inventory/${data.id}`, payload);
        toast.success('Item updated');
      } else {
        await API.post('/inventory', payload);
        toast.success('Item created');
      }
      setFormOpen(false);
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save item');
    }
  };

  const runAiOptimization = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/optimize-inventory', {});
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

  const countByStatus = (status) => items.filter((i) => i.status === status).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>Inventory Management</div>
          <div style={styles.subtitle}>
            Track and manage your warehouse inventory across all locations
          </div>
          <div style={styles.counts}>
            <span style={styles.countBadge('#10b981')}>
              {countByStatus('in_stock')} In Stock
            </span>
            <span style={styles.countBadge('#f59e0b')}>
              {countByStatus('low_stock')} Low Stock
            </span>
            <span style={styles.countBadge('#ef4444')}>
              {countByStatus('critical')} Critical
            </span>
            <span style={styles.countBadge('#64748b')}>
              {countByStatus('out_of_stock')} Out of Stock
            </span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.aiBtn}
            onClick={runAiOptimization}
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
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FiPlus size={16} /> New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FiPackage size={28} color="#8b5cf6" />
            </div>
            <div style={styles.emptyTitle}>No inventory items yet</div>
            <div style={styles.emptySub}>Click "New Item" to add your first inventory item</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Product Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={styles.tr}
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontFamily: 'monospace', color: '#94a3b8' }}>
                    {item.sku}
                  </td>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>
                    {item.product_name}
                  </td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={{
                    ...styles.td,
                    fontWeight: '600',
                    color: item.quantity < item.reorder_point ? '#ef4444' : '#e2e8f0',
                  }}>
                    {item.quantity}
                  </td>
                  <td style={styles.td}>${Number(item.unit_price).toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(item.status)}>
                      {statusLabels[item.status] || item.status}
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
        onClose={() => { setDetailOpen(false); setSelectedItem(null); }}
        title="Inventory Item Details"
        fields={detailFields}
        item={selectedItem}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Inventory Item' : 'New Inventory Item'}
        fields={formFields}
        initialData={editItem}
        onSave={handleSave}
      />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Inventory Optimization"
      />
    </div>
  );
}

export default Inventory;
