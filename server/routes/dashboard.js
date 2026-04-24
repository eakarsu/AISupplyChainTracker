const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [shipments, suppliers, disruptions, inventory, alerts, routes, forecasts, orders, warehouses, compliance, quality] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'in_transit\') as active FROM shipments'),
      pool.query('SELECT COUNT(*) as total, AVG(risk_score) as avg_risk FROM suppliers'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE severity = \'critical\') as critical FROM disruptions'),
      pool.query('SELECT COUNT(*) as total, SUM(quantity * unit_price) as total_value FROM inventory'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM risk_alerts'),
      pool.query('SELECT COUNT(*) as total FROM shipping_routes'),
      pool.query('SELECT COUNT(*) as total FROM demand_forecasts'),
      pool.query('SELECT COUNT(*) as total, SUM(total_amount) as total_value FROM purchase_orders'),
      pool.query('SELECT COUNT(*) as total, ROUND(AVG(CASE WHEN capacity_sqft > 0 THEN (used_sqft::decimal / capacity_sqft) * 100 ELSE 0 END), 1) as avg_capacity FROM warehouses'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\' OR status = \'passed\') as active FROM compliance_records'),
      pool.query('SELECT COUNT(*) as total, ROUND(COUNT(*) FILTER (WHERE result = \'pass\')::decimal / NULLIF(COUNT(*), 0) * 100, 1) as pass_rate FROM quality_inspections'),
    ]);

    res.json({
      shipments: { total: parseInt(shipments.rows[0].total), active: parseInt(shipments.rows[0].active) },
      suppliers: { total: parseInt(suppliers.rows[0].total), avgRisk: parseFloat(suppliers.rows[0].avg_risk || 0).toFixed(1) },
      disruptions: { total: parseInt(disruptions.rows[0].total), critical: parseInt(disruptions.rows[0].critical) },
      inventory: { total: parseInt(inventory.rows[0].total), totalValue: parseFloat(inventory.rows[0].total_value || 0).toFixed(2) },
      alerts: { total: parseInt(alerts.rows[0].total), active: parseInt(alerts.rows[0].active) },
      routes: { total: parseInt(routes.rows[0].total) },
      forecasts: { total: parseInt(forecasts.rows[0].total) },
      orders: { total: parseInt(orders.rows[0].total), totalValue: parseFloat(orders.rows[0].total_value || 0).toFixed(2) },
      warehouses: { total: parseInt(warehouses.rows[0].total), totalCapacity: parseFloat(warehouses.rows[0].avg_capacity || 0).toFixed(1) },
      compliance: { total: parseInt(compliance.rows[0].total), active: parseInt(compliance.rows[0].active) },
      quality: { total: parseInt(quality.rows[0].total), passRate: parseFloat(quality.rows[0].pass_rate || 0).toFixed(1) },
      analytics: { total: 10 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
