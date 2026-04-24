const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, country, category, risk_score, reliability_rating, contact_email, contact_phone, lead_time_days, annual_revenue, compliance_status } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (name, country, category, risk_score, reliability_rating, contact_email, contact_phone, lead_time_days, annual_revenue, compliance_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, country, category, risk_score, reliability_rating, contact_email, contact_phone, lead_time_days, annual_revenue, compliance_status || 'compliant']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, country, category, risk_score, reliability_rating, contact_email, contact_phone, lead_time_days, annual_revenue, compliance_status } = req.body;
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, country=$2, category=$3, risk_score=$4, reliability_rating=$5, contact_email=$6, contact_phone=$7, lead_time_days=$8, annual_revenue=$9, compliance_status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, country, category, risk_score, reliability_rating, contact_email, contact_phone, lead_time_days, annual_revenue, compliance_status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
