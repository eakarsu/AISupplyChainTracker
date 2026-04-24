const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
require('dotenv').config({ path: '../.env' });

const ai = async (prompt) => {
  const r = await axios.post((process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions', {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  const c = r.data.choices[0].message.content;
  try { return JSON.parse(c); } catch { return { analysis: c }; }
};

router.post('/optimize-route', async (req, res) => {
  try {
    const { origin, destination, stops, vehicle_type, constraints } = req.body;
    const result = await ai(`Optimize a delivery route. Origin: ${origin}. Destination: ${destination}. Stops: ${stops || 'none specified'}. Vehicle: ${vehicle_type || 'truck'}. Constraints: ${constraints || 'none'}. Return JSON with: optimized_order (array of stops), total_distance_km, estimated_time, fuel_savings_percent, co2_reduction_kg, route_tips, weather_considerations.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/predict-maintenance', async (req, res) => {
  try {
    const { vehicle_type, mileage, last_maintenance, fuel_level, age_years } = req.body;
    const result = await ai(`Predict maintenance needs. Vehicle: ${vehicle_type}. Mileage: ${mileage}km. Last maintenance: ${last_maintenance}. Fuel level: ${fuel_level}%. Age: ${age_years} years. Return JSON with: predicted_issues (array with issue, probability, urgency, estimated_cost), recommended_schedule, total_estimated_cost, preventive_actions, risk_assessment.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/handle-exception', async (req, res) => {
  try {
    const { exception_type, details, current_location, deliveries_remaining } = req.body;
    const result = await ai(`Handle delivery exception. Type: ${exception_type}. Details: ${details}. Current location: ${current_location}. Remaining deliveries: ${deliveries_remaining}. Return JSON with: recommended_action, alternative_routes (array), affected_deliveries, customer_notification_template, estimated_delay, contingency_plan.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
