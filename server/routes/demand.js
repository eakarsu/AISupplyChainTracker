const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM demand_forecasts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Forecast not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { product_name, category, current_demand, predicted_demand, confidence_score, forecast_period, region, trend, seasonal_factor, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO demand_forecasts (product_name, category, current_demand, predicted_demand, confidence_score, forecast_period, region, trend, seasonal_factor, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [product_name, category, current_demand, predicted_demand, confidence_score, forecast_period, region, trend, seasonal_factor, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { product_name, category, current_demand, predicted_demand, confidence_score, forecast_period, region, trend, seasonal_factor, notes } = req.body;
    const result = await pool.query(
      `UPDATE demand_forecasts SET product_name=$1, category=$2, current_demand=$3, predicted_demand=$4, confidence_score=$5, forecast_period=$6, region=$7, trend=$8, seasonal_factor=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [product_name, category, current_demand, predicted_demand, confidence_score, forecast_period, region, trend, seasonal_factor, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Forecast not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM demand_forecasts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Forecast not found' });
    res.json({ message: 'Forecast deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
