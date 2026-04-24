const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipping_routes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipping_routes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { route_name, origin, destination, transport_mode, distance_km, estimated_hours, cost_per_kg, carbon_emission_kg, reliability_score, status } = req.body;
    const result = await pool.query(
      `INSERT INTO shipping_routes (route_name, origin, destination, transport_mode, distance_km, estimated_hours, cost_per_kg, carbon_emission_kg, reliability_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [route_name, origin, destination, transport_mode, distance_km, estimated_hours, cost_per_kg, carbon_emission_kg, reliability_score, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { route_name, origin, destination, transport_mode, distance_km, estimated_hours, cost_per_kg, carbon_emission_kg, reliability_score, status } = req.body;
    const result = await pool.query(
      `UPDATE shipping_routes SET route_name=$1, origin=$2, destination=$3, transport_mode=$4, distance_km=$5, estimated_hours=$6, cost_per_kg=$7, carbon_emission_kg=$8, reliability_score=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [route_name, origin, destination, transport_mode, distance_km, estimated_hours, cost_per_kg, carbon_emission_kg, reliability_score, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM shipping_routes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
