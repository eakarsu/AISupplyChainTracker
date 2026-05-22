import React, { useEffect, useState } from 'react';
import API from '../services/api';

const emptyForm = { shipment: '', terminal: '', freeTimeHours: 0, projectedDwellHours: 0, exposureUsd: 0, owner: '', status: 'watch' };

export default function DetentionDemurrageExposure() {
  const [exposures, setExposures] = useState([]);
  const [summary, setSummary] = useState({ total: 0, exposureUsd: 0, escalate: 0 });
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const res = await API.get('/detention-demurrage-exposure');
    setExposures(res.data.exposures || []);
    setSummary(res.data.summary || { total: 0, exposureUsd: 0, escalate: 0 });
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    await API.post('/detention-demurrage-exposure', form);
    setForm(emptyForm);
    load();
  };

  return (
    <div>
      <h1>Detention Demurrage Exposure</h1>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>Terminal dwell risk, free-time burn, and cost exposure by shipment.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {['total', 'exposureUsd', 'escalate'].map(key => <div key={key} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16 }}><div style={{ color: '#94a3b8' }}>{key}</div><strong style={{ fontSize: 24 }}>${key === 'exposureUsd' ? summary[key].toLocaleString() : summary[key]}</strong></div>)}
      </div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        {['shipment', 'terminal', 'owner'].map(field => <input key={field} placeholder={field} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />)}
        <input type="number" value={form.freeTimeHours} onChange={e => setForm({ ...form, freeTimeHours: e.target.value })} />
        <input type="number" value={form.projectedDwellHours} onChange={e => setForm({ ...form, projectedDwellHours: e.target.value })} />
        <input type="number" value={form.exposureUsd} onChange={e => setForm({ ...form, exposureUsd: e.target.value })} />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>watch</option><option>clear</option><option>escalate</option></select>
        <button type="submit">Add Exposure</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b' }}>
        <thead><tr>{['Shipment', 'Terminal', 'Free Time', 'Dwell', 'Exposure', 'Owner', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #334155' }}>{h}</th>)}</tr></thead>
        <tbody>{exposures.map(row => <tr key={row.id}><td style={{ padding: 12 }}>{row.shipment}</td><td>{row.terminal}</td><td>{row.freeTimeHours}h</td><td>{row.projectedDwellHours}h</td><td>${row.exposureUsd}</td><td>{row.owner}</td><td>{row.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
