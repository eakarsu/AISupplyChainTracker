const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, compliance_type, entity_name, standard, status, auditor, audit_date, expiry_date, risk_level, findings, corrective_action } = req.body;
    const result = await pool.query(
      `INSERT INTO compliance_records (title, compliance_type, entity_name, standard, status, auditor, audit_date, expiry_date, risk_level, findings, corrective_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, compliance_type, entity_name, standard, status || 'pending', auditor, audit_date, expiry_date, risk_level, findings, corrective_action]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, compliance_type, entity_name, standard, status, auditor, audit_date, expiry_date, risk_level, findings, corrective_action } = req.body;
    const result = await pool.query(
      `UPDATE compliance_records SET title=$1, compliance_type=$2, entity_name=$3, standard=$4, status=$5, auditor=$6, audit_date=$7, expiry_date=$8, risk_level=$9, findings=$10, corrective_action=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [title, compliance_type, entity_name, standard, status, auditor, audit_date, expiry_date, risk_level, findings, corrective_action, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
