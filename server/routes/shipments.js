const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments ORDER BY created_at DESC');
    res.json(result.rows);
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
