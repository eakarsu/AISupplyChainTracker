import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiMap, FiCpu } from 'react-icons/fi';
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

export default function OptimizeNetwork() {
  const [form, setForm] = useState({
    objective: 'cost',
    constraints: '',
    horizon_months: 12,
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
        objective: form.objective,
        constraints: form.constraints || undefined,
        horizon_months: Number(form.horizon_months) || 12,
        notes: form.notes || undefined,
      };
      const res = await API.post('/ai/optimize-network', payload);
      setResult(res.data);
      toast.success('Network optimization complete');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Optimization failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}><FiMap color="#8b5cf6" /> Network Optimization</h1>
      <p style={styles.subtitle}>AI suggests facility/sourcing changes to optimize cost, service or resilience.</p>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Objective</label>
            <select style={styles.input} value={form.objective} onChange={(e) => handleChange('objective', e.target.value)}>
              <option value="cost">Minimize Cost</option>
              <option value="service">Maximize Service Level</option>
              <option value="resilience">Maximize Resilience</option>
              <option value="emissions">Minimize Emissions</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Horizon (months)</label>
            <input style={styles.input} type="number" min={1} max={60} value={form.horizon_months} onChange={(e) => handleChange('horizon_months', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Constraints</label>
            <input style={styles.input} type="text" value={form.constraints} onChange={(e) => handleChange('constraints', e.target.value)} placeholder="e.g. keep US presence" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={styles.label}>Notes / Context</label>
          <textarea style={styles.textarea} rows={3} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Strategic intent, capital limits, ESG goals..." />
        </div>
        <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
          <FiCpu /> {loading ? 'Optimizing...' : 'Optimize Network'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && (
        <div style={styles.card}>
          <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Recommendations</h3>
          <pre style={styles.result}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
