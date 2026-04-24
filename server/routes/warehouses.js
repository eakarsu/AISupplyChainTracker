const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, location, country, capacity_sqft, used_sqft, warehouse_type, manager_name, manager_email, temperature_controlled, status } = req.body;
    const result = await pool.query(
      `INSERT INTO warehouses (name, code, location, country, capacity_sqft, used_sqft, warehouse_type, manager_name, manager_email, temperature_controlled, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, code, location, country, capacity_sqft, used_sqft, warehouse_type, manager_name, manager_email, temperature_controlled, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, code, location, country, capacity_sqft, used_sqft, warehouse_type, manager_name, manager_email, temperature_controlled, status } = req.body;
    const result = await pool.query(
      `UPDATE warehouses SET name=$1, code=$2, location=$3, country=$4, capacity_sqft=$5, used_sqft=$6, warehouse_type=$7, manager_name=$8, manager_email=$9, temperature_controlled=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, code, location, country, capacity_sqft, used_sqft, warehouse_type, manager_name, manager_email, temperature_controlled, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
