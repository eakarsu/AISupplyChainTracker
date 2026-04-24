const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM disruptions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM disruptions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy } = req.body;
    const result = await pool.query(
      `INSERT INTO disruptions (title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy } = req.body;
    const result = await pool.query(
      `UPDATE disruptions SET title=$1, type=$2, severity=$3, region=$4, description=$5, impact_score=$6, probability=$7, affected_suppliers=$8, estimated_duration_days=$9, mitigation_strategy=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM disruptions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json({ message: 'Disruption deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
