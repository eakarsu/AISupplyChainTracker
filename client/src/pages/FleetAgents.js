import React, { useState } from 'react';

const API_URL = 'http://localhost:3001/api';

const renderResult = (obj, depth = 0) => {
  if (!obj) return null;
  if (typeof obj === 'string') return <p style={{ color: '#e0e0e0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{obj}</p>;
  if (Array.isArray(obj)) return <div style={{ marginLeft: depth * 12 }}>{obj.map((item, i) =>
    <div key={i} style={{ background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #e94560' }}>
      {typeof item === 'object' ? renderResult(item, depth + 1) : <span style={{ color: '#e0e0e0' }}>{String(item)}</span>}
    </div>)}</div>;
  return <div style={{ marginLeft: depth * 12 }}>{Object.entries(obj).map(([k, v]) =>
    <div key={k} style={{ marginBottom: 12 }}>
      <div style={{ color: '#e94560', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div>
      {typeof v === 'object' && v !== null ? renderResult(v, depth + 1) :
        <div style={{ color: '#e0e0e0', background: '#0f172a', padding: '8px 12px', borderRadius: 6, fontSize: 14 }}>
          {typeof v === 'number' ? <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: 18 }}>{v}</span> :
           typeof v === 'boolean' ? <span style={{ color: v ? '#2ecc71' : '#e94560', fontWeight: 'bold' }}>{v ? 'Yes' : 'No'}</span> : String(v)}
        </div>}
    </div>)}</div>;
};

export default function FleetAgents() {
  const [tab, setTab] = useState('optimize-route');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});

  const run = async (endpoint, body) => {
    setLoading(true); setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/fleet-agents/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      setResult(await res.json());
    } catch (err) { setResult({ error: err.message }); }
    setLoading(false);
  };

  const agents = [
    { id: 'optimize-route', name: 'Route Optimizer', icon: '🗺️', desc: 'AI-optimized delivery routes with fuel & CO2 savings' },
    { id: 'predict-maintenance', name: 'Maintenance Predictor', icon: '🔧', desc: 'Predict vehicle maintenance needs & schedule' },
    { id: 'handle-exception', name: 'Exception Handler', icon: '⚠️', desc: 'Handle delivery exceptions with contingency plans' },
  ];

  const inp = { width: '100%', padding: 12, marginBottom: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' };

  return (
    <div>
      <h1 style={{ fontSize: 24, color: '#e0e0e0', marginBottom: 8 }}>🤖 Fleet & Logistics Agents</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>AI-powered route optimization, maintenance prediction, and exception handling</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {agents.map(a => (
          <div key={a.id} onClick={() => { setTab(a.id); setResult(null); setForm({}); }}
            style={{ padding: '16px 20px', background: tab === a.id ? '#1e293b' : '#1a1a2e', borderRadius: 10, cursor: 'pointer', border: tab === a.id ? '2px solid #e94560' : '2px solid transparent', flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{a.name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{a.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, marginBottom: 20, border: '1px solid #334155' }}>
        {tab === 'optimize-route' && <>
          <input style={inp} placeholder="Origin (e.g., New York Warehouse)" value={form.origin || ''} onChange={e => setForm({ ...form, origin: e.target.value })} />
          <input style={inp} placeholder="Destination (e.g., Boston Distribution Center)" value={form.destination || ''} onChange={e => setForm({ ...form, destination: e.target.value })} />
          <input style={inp} placeholder="Stops (e.g., Hartford, Springfield, Worcester)" value={form.stops || ''} onChange={e => setForm({ ...form, stops: e.target.value })} />
          <input style={inp} placeholder="Vehicle Type (e.g., truck, van)" value={form.vehicle_type || ''} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} />
          <input style={inp} placeholder="Constraints (e.g., avoid tolls, time window 8am-5pm)" value={form.constraints || ''} onChange={e => setForm({ ...form, constraints: e.target.value })} />
          <button onClick={() => run('optimize-route', form)} disabled={loading || !form.origin || !form.destination}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Optimizing...' : '🗺️ Optimize Route'}
          </button>
        </>}

        {tab === 'predict-maintenance' && <>
          <input style={inp} placeholder="Vehicle Type (e.g., Semi-truck, Delivery Van)" value={form.vehicle_type || ''} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} />
          <input style={inp} placeholder="Mileage (km)" type="number" value={form.mileage || ''} onChange={e => setForm({ ...form, mileage: e.target.value })} />
          <input style={inp} placeholder="Last Maintenance Date" value={form.last_maintenance || ''} onChange={e => setForm({ ...form, last_maintenance: e.target.value })} />
          <input style={inp} placeholder="Fuel Level (%)" type="number" value={form.fuel_level || ''} onChange={e => setForm({ ...form, fuel_level: e.target.value })} />
          <input style={inp} placeholder="Vehicle Age (years)" type="number" value={form.age_years || ''} onChange={e => setForm({ ...form, age_years: e.target.value })} />
          <button onClick={() => run('predict-maintenance', form)} disabled={loading || !form.vehicle_type}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Predicting...' : '🔧 Predict Maintenance'}
          </button>
        </>}

        {tab === 'handle-exception' && <>
          <select style={inp} value={form.exception_type || ''} onChange={e => setForm({ ...form, exception_type: e.target.value })}>
            <option value="">Select Exception Type</option>
            <option value="vehicle_breakdown">Vehicle Breakdown</option>
            <option value="weather_delay">Weather Delay</option>
            <option value="road_closure">Road Closure</option>
            <option value="delivery_refused">Delivery Refused</option>
            <option value="damaged_cargo">Damaged Cargo</option>
          </select>
          <textarea style={{ ...inp, minHeight: 80 }} placeholder="Exception details..." value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} />
          <input style={inp} placeholder="Current Location" value={form.current_location || ''} onChange={e => setForm({ ...form, current_location: e.target.value })} />
          <input style={inp} placeholder="Deliveries Remaining (e.g., 5)" value={form.deliveries_remaining || ''} onChange={e => setForm({ ...form, deliveries_remaining: e.target.value })} />
          <button onClick={() => run('handle-exception', form)} disabled={loading || !form.exception_type || !form.details}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Handling...' : '⚠️ Handle Exception'}
          </button>
        </>}
      </div>

      {result && (
        <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #e94560' }}>
          <h3 style={{ color: '#e94560', margin: '0 0 16px' }}>✨ AI Result</h3>
          {renderResult(result)}
        </div>
      )}
    </div>
  );
}
