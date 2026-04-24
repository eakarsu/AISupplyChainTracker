const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, alert_type, severity, source, description, affected_entity, risk_score, recommended_action, status, region } = req.body;
    const result = await pool.query(
      `INSERT INTO risk_alerts (title, alert_type, severity, source, description, affected_entity, risk_score, recommended_action, status, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, alert_type, severity, source, description, affected_entity, risk_score, recommended_action, status || 'active', region]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, alert_type, severity, source, description, affected_entity, risk_score, recommended_action, status, region } = req.body;
    const result = await pool.query(
      `UPDATE risk_alerts SET title=$1, alert_type=$2, severity=$3, source=$4, description=$5, affected_entity=$6, risk_score=$7, recommended_action=$8, status=$9, region=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, alert_type, severity, source, description, affected_entity, risk_score, recommended_action, status, region, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM risk_alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
