import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiPlus, FiCpu } from 'react-icons/fi';
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
  statusBadge: (status) => {
    const colors = {
      pending: '#eab308',
      approved: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#22c55e',
      delayed: '#ef4444',
      cancelled: '#64748b',
    };
    const color = colors[status] || '#64748b';
    return {
      padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
      background: `${color}18`, color: color, border: `1px solid ${color}30`,
      display: 'inline-block', textTransform: 'capitalize',
    };
  },
  priorityBadge: (priority) => {
    const colors = {
      low: '#64748b',
      medium: '#3b82f6',
      high: '#f97316',
      critical: '#ef4444',
    };
    const color = colors[priority] || '#64748b';
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

const formatCurrency = (value) => {
  if (value == null || value === '') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
};

const detailFields = [
  { key: 'order_number', label: 'Order Number' },
  { key: 'supplier_name', label: 'Supplier Name' },
  { key: 'product', label: 'Product' },
  { key: 'quantity', label: 'Quantity', render: (val) => (val != null ? Number(val).toLocaleString() : 'N/A') },
  { key: 'unit_price', label: 'Unit Price', render: (val) => formatCurrency(val) },
  { key: 'total_amount', label: 'Total Amount', render: (val) => (
    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '15px' }}>{formatCurrency(val)}</span>
  )},
  { key: 'status', label: 'Status', render: (val) => (
    <span style={styles.statusBadge(val)}>{val || 'N/A'}</span>
  )},
  { key: 'priority', label: 'Priority', render: (val) => (
    <span style={styles.priorityBadge(val)}>{val || 'N/A'}</span>
  )},
  { key: 'expected_delivery', label: 'Expected Delivery', render: (val) => (
    val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  )},
  { key: 'notes', label: 'Notes', render: (val) => val || 'No notes' },
];

function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const formFields = [
    { key: 'order_number', label: 'Order Number', placeholder: 'e.g. PO-2026-001' },
    { key: 'supplier_name', label: 'Supplier', type: 'select', options: suppliers.map(s => s.name) },
    { key: 'product', label: 'Product', type: 'select', options: products.map(p => p.product_name) },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0', step: '1' },
    { key: 'unit_price', label: 'Unit Price ($)', type: 'number', placeholder: '0.00', step: '0.01' },
    { key: 'total_amount', label: 'Total Amount ($)', type: 'number', placeholder: 'Auto-calculated', step: '0.01' },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'shipped', 'delivered', 'delayed', 'cancelled'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { key: 'expected_delivery', label: 'Expected Delivery', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', fullWidth: true },
  ];

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load purchase orders');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    API.get('/suppliers').then(res => setSuppliers(res.data)).catch(() => {});
    API.get('/inventory').then(res => setProducts(res.data)).catch(() => {});
  }, []);

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleNew = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order) => {
    setShowDetail(false);
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await API.delete(`/orders/${id}`);
      toast.success('Purchase order deleted successfully');
      setShowDetail(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to delete purchase order');
      console.error(err);
    }
  };

  const handleSave = async (data) => {
    // Auto-calculate total_amount before saving
    const quantity = parseFloat(data.quantity) || 0;
    const unitPrice = parseFloat(data.unit_price) || 0;
    const payload = {
      ...data,
      quantity,
      unit_price: unitPrice,
      total_amount: parseFloat((quantity * unitPrice).toFixed(2)),
    };

    try {
      if (data.id) {
        await API.put(`/orders/${data.id}`, payload);
        toast.success('Purchase order updated successfully');
      } else {
        await API.post('/orders', payload);
        toast.success('Purchase order created successfully');
      }
      setShowForm(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(data.id ? 'Failed to update purchase order' : 'Failed to create purchase order');
      console.error(err);
    }
  };

  const runAIAnalysis = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze', {
        query: 'Analyze current purchase orders, identify cost optimization opportunities, supplier consolidation, and procurement efficiency improvements.',
      });
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

  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const delayedCount = orders.filter((o) => o.status === 'delayed').length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>
            <FiShoppingCart size={28} color="#3b82f6" />
            Purchase Orders
          </div>
          <div style={styles.subtitle}>
            Manage purchase orders, track deliveries, and run AI-powered procurement analysis
          </div>
          <div style={styles.statsRow}>
            <span style={styles.statBadge('#3b82f6')}>{totalOrders} Orders</span>
            <span style={styles.statBadge('#10b981')}>{formatCurrency(totalValue)} Total Value</span>
            <span style={styles.statBadge('#eab308')}>{pendingCount} Pending</span>
            <span style={styles.statBadge('#ef4444')}>{delayedCount} Delayed</span>
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
            AI Analyze
          </button>
          <button
            style={styles.newBtn}
            onClick={handleNew}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <FiPlus size={16} />
            New Order
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order Number</th>
              <th style={styles.th}>Supplier</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Total Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.empty}>
                  No purchase orders found. Click "New Order" to create one.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  style={styles.row}
                  onClick={() => handleRowClick(order)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#f1f5f9' }}>{order.order_number}</td>
                  <td style={styles.td}>{order.supplier_name}</td>
                  <td style={styles.td}>{order.product}</td>
                  <td style={styles.td}>{order.quantity != null ? Number(order.quantity).toLocaleString() : 'N/A'}</td>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#10b981' }}>{formatCurrency(order.total_amount)}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(order.status)}>{order.status || 'N/A'}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.priorityBadge(order.priority)}>{order.priority || 'N/A'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedOrder(null); }}
        title="Purchase Order Details"
        fields={detailFields}
        item={selectedOrder}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingOrder(null); }}
        title={editingOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
        fields={formFields}
        initialData={editingOrder}
        onSave={handleSave}
      />

      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Procurement Analysis"
      />
    </div>
  );
}

export default PurchaseOrders;
