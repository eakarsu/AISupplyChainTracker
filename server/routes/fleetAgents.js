const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
require('dotenv').config({ path: '../.env' });

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

function parseAIJson(content) {
  try { return JSON.parse(content); } catch {}
  try {
    const stripped = content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(stripped);
  } catch {}
  try {
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1) return JSON.parse(content.slice(first, last + 1));
  } catch {}
  return null;
}

const ai = async (prompt) => {
  const r = await axios.post(
    (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions',
    { model: MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.7 },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  const content = r.data.choices[0].message.content;
  const parsed = parseAIJson(content);
  if (parsed) return parsed;
  return { analysis: content };
};

router.post('/optimize-route', async (req, res) => {
  try {
    const { origin, destination, stops, vehicle_type, constraints } = req.body;
    const result = await ai(`Optimize a delivery route. Origin: ${origin}. Destination: ${destination}. Stops: ${stops || 'none'}. Vehicle: ${vehicle_type || 'truck'}. Constraints: ${constraints || 'none'}.

Return JSON: { "route": { "optimized_order": [], "total_distance_km": 0, "estimated_time_hours": 0, "fuel_savings_percent": 0, "co2_reduction_kg": 0, "route_tips": [], "weather_considerations": [] } }`);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI service error' });
  }
});

router.post('/predict-maintenance', async (req, res) => {
  try {
    const { vehicle_type, mileage, last_maintenance, fuel_level, age_years } = req.body;
    const result = await ai(`Predict maintenance needs. Vehicle: ${vehicle_type}. Mileage: ${mileage}km. Last maintenance: ${last_maintenance}. Fuel: ${fuel_level}%. Age: ${age_years} years.

Return JSON: { "maintenance": { "predicted_issues": [{ "issue": "", "probability": 0, "urgency": "high|medium|low", "estimated_cost": 0 }], "recommended_schedule": "", "total_estimated_cost": 0, "preventive_actions": [], "risk_assessment": "" } }`);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI service error' });
  }
});

router.post('/handle-exception', async (req, res) => {
  try {
    const { exception_type, details, current_location, deliveries_remaining } = req.body;
    const result = await ai(`Handle delivery exception. Type: ${exception_type}. Details: ${details}. Location: ${current_location}. Remaining: ${deliveries_remaining}.

Return JSON: { "exception": { "recommended_action": "", "alternative_routes": [], "affected_deliveries": [], "customer_notification_template": "", "estimated_delay_hours": 0, "contingency_plan": "" } }`);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI service error' });
  }
});

module.exports = router;
