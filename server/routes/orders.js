const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { order_number, supplier_name, product, quantity, unit_price, total_amount, status, expected_delivery, priority, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO purchase_orders (order_number, supplier_name, product, quantity, unit_price, total_amount, status, expected_delivery, priority, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [order_number, supplier_name, product, quantity, unit_price, total_amount, status || 'pending', expected_delivery, priority || 'medium', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { order_number, supplier_name, product, quantity, unit_price, total_amount, status, expected_delivery, priority, notes } = req.body;
    const result = await pool.query(
      `UPDATE purchase_orders SET order_number=$1, supplier_name=$2, product=$3, quantity=$4, unit_price=$5, total_amount=$6, status=$7, expected_delivery=$8, priority=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [order_number, supplier_name, product, quantity, unit_price, total_amount, status, expected_delivery, priority, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
