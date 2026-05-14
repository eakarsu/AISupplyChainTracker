import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STATUS_COLORS = {
  in_transit: '#3b82f6', delivered: '#10b981', pending: '#f59e0b',
  delayed: '#ef4444', cancelled: '#6b7280'
};

// Simple SVG world map visualization (no external Leaflet dependency needed)
function MapVisualization({ shipments }) {
  const width = 800;
  const height = 400;

  // Convert lat/lng to SVG coordinates
  const toSVG = (lat, lng) => ({
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height
  });

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '1rem', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Ocean background */}
        <rect width={width} height={height} fill="#0f172a" rx="4" />

        {/* Simple continent outlines (approximate) */}
        <rect x="20" y="80" width="180" height="120" rx="10" fill="#1e293b" opacity="0.6" />
        <rect x="280" y="60" width="200" height="160" rx="10" fill="#1e293b" opacity="0.6" />
        <rect x="270" y="220" width="180" height="140" rx="10" fill="#1e293b" opacity="0.6" />
        <rect x="550" y="50" width="180" height="200" rx="10" fill="#1e293b" opacity="0.6" />
        <rect x="620" y="260" width="100" height="100" rx="10" fill="#1e293b" opacity="0.6" />

        {/* Shipment lines */}
        {shipments.map((s, i) => {
          if (!s.origin_lat || !s.dest_lat) return null;
          const orig = toSVG(s.origin_lat, s.origin_lng);
          const dest = toSVG(s.dest_lat, s.dest_lng);
          const color = STATUS_COLORS[s.status] || '#6b7280';
          return (
            <g key={i}>
              <line
                x1={orig.x} y1={orig.y} x2={dest.x} y2={dest.y}
                stroke={color} strokeWidth="1.5" strokeOpacity="0.6"
                strokeDasharray={s.status === 'in_transit' ? '4 2' : 'none'}
              />
              <circle cx={orig.x} cy={orig.y} r="4" fill={color} opacity="0.9" />
              <circle cx={dest.x} cy={dest.y} r="4" fill={color} opacity="0.7" />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShipmentMap() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem('token');

  useEffect(() => { fetchMapData(); }, []);

  const fetchMapData = async () => {
    try {
      const res = await fetch(`${API}/api/shipments/map-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShipments(data.shipments || []);
    } catch {
      toast.error('Failed to load shipment map data');
    }
    setLoading(false);
  };

  const filtered = filter === 'all' ? shipments : shipments.filter(s => s.status === filter);
  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Live Shipment Map</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Real-time visualization of all shipment routes</p>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading map data...</div>
      ) : (
        <div>
          {/* Status summary */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: filter === 'all' ? '#3b82f6' : '#1e293b',
                color: '#f1f5f9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
              }}
            >All ({shipments.length})</button>
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none',
                  background: filter === status ? STATUS_COLORS[status] : '#1e293b',
                  color: '#f1f5f9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >{status.replace('_', ' ')} ({count})</button>
            ))}
          </div>

          <MapVisualization shipments={filtered} />

          {/* Shipment table */}
          <div style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.75rem' }}>
              Shipment List ({filtered.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#1e293b' }}>
                    {['Tracking #', 'Origin', 'Destination', 'Carrier', 'Status', 'Priority', 'ETA'].map(h => (
                      <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, border: '1px solid #334155' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0f172a' : '#111827' }}>
                      <td style={{ padding: '0.75rem', color: '#e2e8f0', border: '1px solid #1e293b' }}>{s.tracking_number || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', border: '1px solid #1e293b' }}>{s.origin}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', border: '1px solid #1e293b' }}>{s.destination}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', border: '1px solid #1e293b' }}>{s.carrier}</td>
                      <td style={{ padding: '0.75rem', border: '1px solid #1e293b' }}>
                        <span style={{
                          background: STATUS_COLORS[s.status] + '30', color: STATUS_COLORS[s.status] || '#94a3b8',
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize'
                        }}>{s.status?.replace('_', ' ')}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', border: '1px solid #1e293b', textTransform: 'capitalize' }}>{s.priority}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', border: '1px solid #1e293b' }}>
                        {s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
