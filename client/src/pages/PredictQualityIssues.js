import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiCpu } from 'react-icons/fi';
import API from '../services/api';

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto' },
  title: {
    fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  subtitle: { fontSize: '14px', color: '#64748b', marginBottom: '24px' },
  card: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
    padding: '24px', marginBottom: '20px',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px',
  },
  label: { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px',
    fontFamily: 'inherit', resize: 'vertical',
  },
  button: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
    marginTop: '14px',
  },
  result: {
    background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
    padding: '16px', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontSize: '13px',
    fontFamily: 'monospace', overflow: 'auto',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5',
    padding: '12px', borderRadius: '8px', marginBottom: '16px',
  },
};

export default function PredictQualityIssues() {
  const [form, setForm] = useState({
    supplier_id: '',
    product: '',
    historical_window_days: 90,
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const payload = {
        ...(form.supplier_id ? { supplier_id: Number(form.supplier_id) } : {}),
        product: form.product || undefined,
        historical_window_days: Number(form.historical_window_days) || 90,
        notes: form.notes || undefined,
      };
      const res = await API.post('/ai/predict-quality-issues', payload);
      setResult(res.data);
      toast.success('Quality risk predicted');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Prediction failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}><FiAlertTriangle color="#f59e0b" /> Predict Quality Issues</h1>
      <p style={styles.subtitle}>AI flags suppliers and routes with elevated quality risk based on historical patterns.</p>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Supplier ID (optional)</label>
            <input style={styles.input} type="number" value={form.supplier_id} onChange={(e) => handleChange('supplier_id', e.target.value)} placeholder="e.g. 5" />
          </div>
          <div>
            <label style={styles.label}>Product / Category</label>
            <input style={styles.input} type="text" value={form.product} onChange={(e) => handleChange('product', e.target.value)} placeholder="e.g. EV battery cells" />
          </div>
          <div>
            <label style={styles.label}>Historical Window (days)</label>
            <input style={styles.input} type="number" min={7} max={730} value={form.historical_window_days} onChange={(e) => handleChange('historical_window_days', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={styles.label}>Notes / Context</label>
          <textarea style={styles.textarea} rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Recent change in process, supplier change, etc." />
        </div>
        <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
          <FiCpu /> {loading ? 'Predicting...' : 'Predict Quality Risk'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && (
        <div style={styles.card}>
          <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Risk Prediction</h3>
          <pre style={styles.result}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
