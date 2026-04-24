const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sku, product_name, category, quantity, unit_price, warehouse_location, reorder_point, supplier_id, last_restocked, status } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (sku, product_name, category, quantity, unit_price, warehouse_location, reorder_point, supplier_id, last_restocked, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [sku, product_name, category, quantity, unit_price, warehouse_location, reorder_point, supplier_id, last_restocked, status || 'in_stock']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { sku, product_name, category, quantity, unit_price, warehouse_location, reorder_point, supplier_id, last_restocked, status } = req.body;
    const result = await pool.query(
      `UPDATE inventory SET sku=$1, product_name=$2, category=$3, quantity=$4, unit_price=$5, warehouse_location=$6, reorder_point=$7, supplier_id=$8, last_restocked=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [sku, product_name, category, quantity, unit_price, warehouse_location, reorder_point, supplier_id, last_restocked, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
