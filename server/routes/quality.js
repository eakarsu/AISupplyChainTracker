const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quality_inspections ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quality_inspections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { inspection_number, product_name, supplier_name, batch_number, inspection_type, result: inspResult, defects_found, defect_rate, inspector, inspection_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO quality_inspections (inspection_number, product_name, supplier_name, batch_number, inspection_type, result, defects_found, defect_rate, inspector, inspection_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [inspection_number, product_name, supplier_name, batch_number, inspection_type, inspResult || 'pending', defects_found, defect_rate, inspector, inspection_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { inspection_number, product_name, supplier_name, batch_number, inspection_type, result: inspResult, defects_found, defect_rate, inspector, inspection_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE quality_inspections SET inspection_number=$1, product_name=$2, supplier_name=$3, batch_number=$4, inspection_type=$5, result=$6, defects_found=$7, defect_rate=$8, inspector=$9, inspection_date=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [inspection_number, product_name, supplier_name, batch_number, inspection_type, inspResult, defects_found, defect_rate, inspector, inspection_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM quality_inspections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json({ message: 'Inspection deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
