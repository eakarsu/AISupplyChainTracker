import React, { useState } from 'react';
import NativeAIControls from '../components/NativeAIControls.jsx';
import AIReport from '../components/AIReport';

const API_URL = 'http://localhost:3001/api';

const examples = {
  'optimize-route': [
    { origin: 'New York warehouse', destination: 'Boston distribution center', stops: 'Hartford; Worcester', vehicle_type: 'Delivery truck', constraints: 'Eight-hour driver shift; avoid low-clearance roads' },
    { origin: 'Chicago depot', destination: 'Milwaukee hub', stops: 'Evanston; Waukegan', vehicle_type: 'Electric delivery van', constraints: 'Return with at least 20% battery; arrive by 17:00' },
    { origin: 'Los Angeles warehouse', destination: 'San Diego hub', stops: 'Irvine; Oceanside', vehicle_type: 'Refrigerated truck', constraints: 'Preserve cold chain; prioritize time windows and rest breaks' },
  ],
  'predict-maintenance': [
    { vehicle_type: 'Delivery van', mileage: '68000', last_maintenance: '2026-08-15', fuel_level: '62', age_years: '4' },
    { vehicle_type: 'Semi-truck', mileage: '212000', last_maintenance: '2026-07-20', fuel_level: '38', age_years: '7' },
    { vehicle_type: 'Refrigerated truck', mileage: '125000', last_maintenance: '2026-09-01', fuel_level: '74', age_years: '5' },
  ],
  'handle-exception': [
    { exception_type: 'vehicle_breakdown', details: 'Delivery van stopped before its next appointment; dispatch needs a replacement and customer update.', current_location: 'Hartford, CT', deliveries_remaining: '5' },
    { exception_type: 'weather_delay', details: 'Heavy rain has slowed the regional route; reassess arrival windows and safe routing.', current_location: 'Waukegan, IL', deliveries_remaining: '8' },
    { exception_type: 'damaged_cargo', details: 'One pallet shows visible damage at transfer; isolate it and confirm the remaining delivery plan.', current_location: 'Irvine, CA', deliveries_remaining: '3' },
  ],
};

export default function FleetAgents() {
  const [tab, setTab] = useState('optimize-route');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const presets = ['Route review', 'Capacity review', 'Risk review'].map((name, index) => ({
    name,
    fill: () => { const values = examples[tab][index]; setForm(values); return { filled: Object.keys(values).length, manual: [] }; },
  }));

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
    <NativeAIControls busy={loading} context="fleet and logistics" presets={presets}><div>
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
          <AIReport response={result} title="Fleet agent result" />
        </div>
      )}
    </div></NativeAIControls>
  );
}
