const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/shipments with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM shipments ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM shipments')
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shipments/map-data - returns shipments with lat/lng for map
router.get('/map-data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments WHERE status != $1 ORDER BY created_at DESC LIMIT 100', ['cancelled']);

    // Add simulated lat/lng based on location names (in production would use geocoding API)
    const locationCoords = {
      'new york': [40.7128, -74.0060], 'los angeles': [34.0522, -118.2437],
      'chicago': [41.8781, -87.6298], 'houston': [29.7604, -95.3698],
      'london': [51.5074, -0.1278], 'paris': [48.8566, 2.3522],
      'berlin': [52.5200, 13.4050], 'tokyo': [35.6762, 139.6503],
      'beijing': [39.9042, 116.4074], 'shanghai': [31.2304, 121.4737],
      'singapore': [1.3521, 103.8198], 'dubai': [25.2048, 55.2708],
      'sydney': [-33.8688, 151.2093], 'toronto': [43.6532, -79.3832],
      'default': [0, 0]
    };

    const getCoords = (location) => {
      if (!location) return locationCoords.default;
      const key = Object.keys(locationCoords).find(k => location.toLowerCase().includes(k));
      return key ? locationCoords[key] : [
        (Math.random() * 160 - 80),
        (Math.random() * 360 - 180)
      ];
    };

    const mapData = result.rows.map(s => ({
      ...s,
      origin_lat: getCoords(s.origin)[0],
      origin_lng: getCoords(s.origin)[1],
      dest_lat: getCoords(s.destination)[0],
      dest_lng: getCoords(s.destination)[1]
    }));

    res.json({ shipments: mapData, count: mapData.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tracking_number, origin, destination, carrier, status, weight_kg, estimated_delivery, current_location, shipment_type, priority } = req.body;
    const result = await pool.query(
      `INSERT INTO shipments (tracking_number, origin, destination, carrier, status, weight_kg, estimated_delivery, current_location, shipment_type, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tracking_number, origin, destination, carrier, status || 'pending', weight_kg, estimated_delivery, current_location, shipment_type, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { tracking_number, origin, destination, carrier, status, weight_kg, estimated_delivery, current_location, shipment_type, priority } = req.body;
    const result = await pool.query(
      `UPDATE shipments SET tracking_number=$1, origin=$2, destination=$3, carrier=$4, status=$5, weight_kg=$6, estimated_delivery=$7, current_location=$8, shipment_type=$9, priority=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [tracking_number, origin, destination, carrier, status, weight_kg, estimated_delivery, current_location, shipment_type, priority, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM shipments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Shipment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
