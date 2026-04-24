const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/shipment-status', async (req, res) => {
  try {
    const result = await pool.query(`SELECT status, COUNT(*) as count FROM shipments GROUP BY status ORDER BY count DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/supplier-risk', async (req, res) => {
  try {
    const result = await pool.query(`SELECT name, risk_score, reliability_rating, country FROM suppliers ORDER BY risk_score DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/inventory-by-category', async (req, res) => {
  try {
    const result = await pool.query(`SELECT category, COUNT(*) as count, SUM(quantity) as total_quantity, SUM(quantity * unit_price) as total_value FROM inventory GROUP BY category ORDER BY total_value DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/disruption-by-type', async (req, res) => {
  try {
    const result = await pool.query(`SELECT type, COUNT(*) as count, AVG(impact_score) as avg_impact FROM disruptions GROUP BY type ORDER BY count DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/demand-trends', async (req, res) => {
  try {
    const result = await pool.query(`SELECT product_name, current_demand, predicted_demand, trend, confidence_score FROM demand_forecasts ORDER BY predicted_demand DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/route-efficiency', async (req, res) => {
  try {
    const result = await pool.query(`SELECT route_name, transport_mode, cost_per_kg, reliability_score, carbon_emission_kg, distance_km FROM shipping_routes ORDER BY reliability_score DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/order-status', async (req, res) => {
  try {
    const result = await pool.query(`SELECT status, COUNT(*) as count, SUM(total_amount) as total_value FROM purchase_orders GROUP BY status ORDER BY total_value DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/alerts-by-severity', async (req, res) => {
  try {
    const result = await pool.query(`SELECT severity, COUNT(*) as count FROM risk_alerts GROUP BY severity ORDER BY count DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/warehouse-utilization', async (req, res) => {
  try {
    const result = await pool.query(`SELECT name, capacity_sqft, used_sqft, ROUND((used_sqft::decimal / NULLIF(capacity_sqft, 0)) * 100, 1) as utilization_pct FROM warehouses WHERE status = 'active' ORDER BY utilization_pct DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/quality-summary', async (req, res) => {
  try {
    const result = await pool.query(`SELECT result, COUNT(*) as count FROM quality_inspections GROUP BY result ORDER BY count DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
