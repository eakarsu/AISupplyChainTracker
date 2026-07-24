const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const NodeCache = require('node-cache');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// 15-minute AI response cache
const aiCache = new NodeCache({ stdTTL: 900 });

// Rate limiter: 20 AI calls per hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req.ip),
  message: { error: 'Too many AI requests, please try again later.' }
});

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

async function callAI(prompt, useCache = true) {
  const cacheKey = crypto.createHash('md5').update(prompt).digest('hex');
  if (useCache) {
    const cached = aiCache.get(cacheKey);
    if (cached) return { content: cached, fromCache: true };
  }

  if (!OPENROUTER_KEY) {
    const err = new Error('AI service unavailable: OPENROUTER_API_KEY is not configured');
    err.status = 503;
    throw err;
  }

  const startTime = Date.now();
  try {
    const response = await axios.post(
      `${OPENROUTER_URL}/chat/completions`,
      { model: MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.7 },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Supply Chain Tracker',
        },
        timeout: 30000
      }
    );
    const content = response.data.choices[0].message.content;
    const tokens = response.data.usage?.total_tokens;
    const latency = Date.now() - startTime;

    if (useCache) aiCache.set(cacheKey, content);
    return { content, tokens, latency, fromCache: false };
  } catch (err) {
    console.error('AI API Error:', err.response?.data || err.message);
    throw new Error('AI service unavailable');
  }
}

async function persistAIResult(userId, endpoint, inputData, result, tokens, latency) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result, tokens_used, latency_ms) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result), tokens || null, latency || null]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

// Disruption Prediction
router.post('/predict-disruption', aiRateLimiter, async (req, res) => {
  try {
    const { region, supplierData, context } = req.body;
    let dataContext = '';
    if (!context) {
      const disruptions = await pool.query('SELECT * FROM disruptions ORDER BY created_at DESC LIMIT 10');
      const suppliers = await pool.query('SELECT name, country, risk_score, category FROM suppliers WHERE country ILIKE $1 OR $1 IS NULL LIMIT 10', [region || null]);
      dataContext = `Current disruptions: ${JSON.stringify(disruptions.rows)}\nSuppliers in region: ${JSON.stringify(suppliers.rows)}`;
    }

    const prompt = `You are a supply chain disruption prediction AI. Analyze data and return structured JSON.

${context || dataContext}
${region ? `Focus region: ${region}` : ''}

Return JSON: { "risk_level": "low|medium|high|critical", "risk_score": 0, "predicted_disruptions": [{ "type": "", "probability": 0, "impact": "", "timeline": "", "mitigation": "" }], "recommended_actions": [], "confidence_score": 0 }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'predict-disruption', { region }, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'disruption_prediction', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Supplier Risk Assessment
router.post('/assess-supplier-risk', aiRateLimiter, async (req, res) => {
  try {
    const { supplierId, context } = req.body;
    let dataContext = '';
    if (supplierId) {
      const supplier = await pool.query('SELECT * FROM suppliers WHERE id = $1', [supplierId]);
      const alerts = await pool.query("SELECT * FROM risk_alerts WHERE affected_entity ILIKE '%' || $1 || '%' LIMIT 5", [supplier.rows[0]?.name || '']);
      dataContext = `Supplier: ${JSON.stringify(supplier.rows[0])}\nRelated alerts: ${JSON.stringify(alerts.rows)}`;
    } else {
      const suppliers = await pool.query('SELECT * FROM suppliers ORDER BY risk_score DESC LIMIT 10');
      dataContext = `Top risk suppliers: ${JSON.stringify(suppliers.rows)}`;
    }

    const prompt = `You are a supplier risk assessment AI. Return structured JSON.

${context || dataContext}

Return JSON: { "overall_risk_rating": 0, "risk_level": "low|medium|high|critical", "financial_risk": "", "geopolitical_risk": "", "operational_risk": "", "compliance_risk": "", "recommendations": [], "monitoring_metrics": [] }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'assess-supplier-risk', { supplierId }, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'supplier_risk', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Route Optimization
router.post('/optimize-route', aiRateLimiter, async (req, res) => {
  try {
    const { routeId, context } = req.body;
    let dataContext = '';
    if (routeId) {
      const route = await pool.query('SELECT * FROM shipping_routes WHERE id = $1', [routeId]);
      dataContext = `Route: ${JSON.stringify(route.rows[0])}`;
    } else {
      const routes = await pool.query('SELECT * FROM shipping_routes ORDER BY cost_per_kg DESC LIMIT 10');
      dataContext = `Routes to optimize: ${JSON.stringify(routes.rows)}`;
    }

    const prompt = `You are a logistics route optimization AI. Return structured JSON.

${context || dataContext}

Return JSON: { "efficiency_score": 0, "cost_savings_percent": 0, "time_savings_percent": 0, "alternative_routes": [{ "name": "", "pros": [], "cons": [], "estimated_cost": 0 }], "recommendations": [], "seasonal_adjustments": [] }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'optimize-route', { routeId }, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'route_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Demand Forecasting
router.post('/forecast-demand', aiRateLimiter, async (req, res) => {
  try {
    const { productId, context } = req.body;
    let dataContext = '';
    if (productId) {
      const forecast = await pool.query('SELECT * FROM demand_forecasts WHERE id = $1', [productId]);
      const inventory = await pool.query('SELECT * FROM inventory WHERE product_name ILIKE $1 LIMIT 5', [`%${forecast.rows[0]?.product_name || ''}%`]);
      dataContext = `Forecast: ${JSON.stringify(forecast.rows[0])}\nInventory: ${JSON.stringify(inventory.rows)}`;
    } else {
      const forecasts = await pool.query('SELECT * FROM demand_forecasts ORDER BY created_at DESC LIMIT 10');
      dataContext = `Recent forecasts: ${JSON.stringify(forecasts.rows)}`;
    }

    const prompt = `You are a demand forecasting AI. Return structured JSON.

${context || dataContext}

Return JSON: { "demand_trend": "growing|stable|declining", "growth_rate_percent": 0, "forecast_30d": { "quantity": 0, "confidence": 0 }, "forecast_90d": { "quantity": 0, "confidence": 0 }, "seasonal_patterns": [], "inventory_recommendations": [], "risk_factors": [] }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'forecast-demand', { productId }, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'demand_forecast', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// General Supply Chain Analysis
router.post('/analyze', aiRateLimiter, async (req, res) => {
  try {
    const { query, context } = req.body;
    let dataContext = '';
    if (!context) {
      const [shipments, suppliers, disruptions] = await Promise.all([
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'in_transit\') as active FROM shipments'),
        pool.query('SELECT COUNT(*) as total, AVG(risk_score) as avg_risk FROM suppliers'),
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE severity = \'critical\') as critical FROM disruptions'),
      ]);
      dataContext = `Supply chain overview: ${JSON.stringify({ shipments: shipments.rows[0], suppliers: suppliers.rows[0], disruptions: disruptions.rows[0] })}`;
    }

    const prompt = `You are an AI supply chain analyst. ${query || 'Analyze the current supply chain status.'}

Data: ${context || dataContext}

Return JSON: { "health_score": 0, "key_findings": [], "risks": [], "opportunities": [], "immediate_actions": [], "kpis": { "on_time_delivery": 0, "supplier_reliability": 0, "inventory_health": 0 } }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'analyze', { query }, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'general_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Inventory Optimization
router.post('/optimize-inventory', aiRateLimiter, async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const inventory = await pool.query('SELECT * FROM inventory ORDER BY quantity ASC LIMIT 15');
      dataContext = `Current inventory: ${JSON.stringify(inventory.rows)}`;
    }

    const prompt = `You are an inventory optimization AI. Return structured JSON.

${context || dataContext}

Return JSON: { "health_score": 0, "low_stock_alerts": [{ "item": "", "current": 0, "recommended": 0, "urgency": "high|medium|low" }], "overstock_items": [], "reorder_recommendations": [], "cost_savings_estimate": 0, "abc_analysis": { "a_items": [], "b_items": [], "c_items": [] } }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'optimize-inventory', {}, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'inventory_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Warehouse Optimization
router.post('/optimize-warehouse', aiRateLimiter, async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const warehouses = await pool.query('SELECT * FROM warehouses ORDER BY created_at DESC LIMIT 15');
      dataContext = `Warehouses: ${JSON.stringify(warehouses.rows)}`;
    }

    const prompt = `You are a warehouse optimization AI. Return structured JSON.

${context || dataContext}

Return JSON: { "utilization_score": 0, "capacity_alerts": [], "layout_recommendations": [], "cost_reduction_opportunities": [], "automation_opportunities": [], "action_plan": [] }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'optimize-warehouse', {}, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'warehouse_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Compliance Analysis
router.post('/analyze-compliance', aiRateLimiter, async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const compliance = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC LIMIT 15');
      dataContext = `Compliance records: ${JSON.stringify(compliance.rows)}`;
    }

    const prompt = `You are a supply chain compliance AI. Return structured JSON.

${context || dataContext}

Return JSON: { "compliance_score": 0, "critical_gaps": [], "expiring_certifications": [], "risk_areas": [], "corrective_actions": [], "90_day_roadmap": [] }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'analyze-compliance', {}, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'compliance_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Quality Analysis
router.post('/analyze-quality', aiRateLimiter, async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const quality = await pool.query('SELECT * FROM quality_inspections ORDER BY created_at DESC LIMIT 15');
      dataContext = `Quality inspections: ${JSON.stringify(quality.rows)}`;
    }

    const prompt = `You are a quality control AI analyst. Return structured JSON.

${context || dataContext}

Return JSON: { "quality_score": 0, "defect_trends": [], "supplier_quality_ranking": [], "root_causes": [], "process_improvements": [], "cost_of_quality_estimate": 0 }`;

    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'analyze-quality', {}, parsed, tokens, latency);

    res.json({ analysis: content, parsed, type: 'quality_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Multi-Agent Weekly Plan (NEW)
router.post('/weekly-plan', aiRateLimiter, async (req, res) => {
  try {
    // Fetch data for all agents in parallel
    const [routes, inventory, demand, disruptions] = await Promise.all([
      pool.query('SELECT * FROM shipping_routes ORDER BY cost_per_kg DESC LIMIT 5'),
      pool.query('SELECT * FROM inventory ORDER BY quantity ASC LIMIT 10'),
      pool.query('SELECT * FROM demand_forecasts ORDER BY created_at DESC LIMIT 5'),
      pool.query('SELECT * FROM disruptions WHERE severity IN (\'high\', \'critical\') ORDER BY created_at DESC LIMIT 5')
    ]);

    // Call all three agents in parallel
    const [routeResult, inventoryResult, demandResult] = await Promise.all([
      callAI(`Route optimization agent: ${JSON.stringify(routes.rows)}. Provide top 3 route optimization actions for this week. Return JSON: { "route": { "top_actions": [], "expected_savings": 0, "priority_routes": [] } }`, false),
      callAI(`Inventory management agent: ${JSON.stringify(inventory.rows)}. Provide top 3 inventory actions for this week. Return JSON: { "maintenance": { "reorder_items": [], "overstock_items": [], "estimated_cost": 0 } }`, false),
      callAI(`Demand forecasting agent: ${JSON.stringify(demand.rows)}. Provide demand forecast for this week. Return JSON: { "exception": { "high_demand_items": [], "low_demand_items": [], "adjustments": [] } }`, false)
    ]);

    const routeParsed = parseAIJson(routeResult.content) || { route: { top_actions: [], expected_savings: 0 } };
    const inventoryParsed = parseAIJson(inventoryResult.content) || { maintenance: { reorder_items: [] } };
    const demandParsed = parseAIJson(demandResult.content) || { exception: { adjustments: [] } };

    // Synthesize weekly plan
    const synthPrompt = `You are a supply chain coordinator. Synthesize this weekly operations plan.

Route Agent findings: ${JSON.stringify(routeParsed)}
Inventory Agent findings: ${JSON.stringify(inventoryParsed)}
Demand Agent findings: ${JSON.stringify(demandParsed)}
Active disruptions: ${JSON.stringify(disruptions.rows)}

Return a coordinated weekly operations plan as JSON: { "week_summary": "", "priority_actions": [{ "day": "", "action": "", "agent": "route|inventory|demand", "impact": "" }], "kpi_targets": { "cost_reduction": 0, "on_time_delivery": 0, "inventory_health": 0 }, "risk_flags": [], "executive_summary": "" }`;

    const { content, tokens, latency } = await callAI(synthPrompt, false);
    const weeklyPlan = parseAIJson(content) || { raw: content };

    const fullPlan = {
      weekly_plan: weeklyPlan,
      agent_outputs: { route: routeParsed, inventory: inventoryParsed, demand: demandParsed }
    };

    await persistAIResult(req.user?.id, 'weekly-plan', { routeRows: routes.rows.length }, fullPlan, tokens, latency);
    res.json({ plan: fullPlan, type: 'weekly_plan', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Supplier Scorecard (NEW)
router.get('/supplier-scorecard/:id', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const [supplier, orders, alerts, quality] = await Promise.all([
      pool.query('SELECT * FROM suppliers WHERE id = $1', [id]),
      pool.query('SELECT * FROM purchase_orders WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 20', [id]).catch(() => ({ rows: [] })),
      pool.query("SELECT * FROM risk_alerts WHERE affected_entity ILIKE '%' || (SELECT name FROM suppliers WHERE id = $1) || '%' LIMIT 10", [id]),
      pool.query('SELECT * FROM quality_inspections WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 10', [id]).catch(() => ({ rows: [] }))
    ]);

    if (supplier.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });

    const s = supplier.rows[0];
    const orderRows = orders.rows;
    const onTimeOrders = orderRows.filter(o => o.status === 'delivered').length;
    const onTimeRate = orderRows.length > 0 ? Math.round((onTimeOrders / orderRows.length) * 100) : null;

    const prompt = `Generate a monthly executive narrative for this supplier:
Supplier: ${JSON.stringify(s)}
Order history (${orderRows.length} orders, on-time rate: ${onTimeRate}%): ${JSON.stringify(orderRows.slice(0, 5))}
Risk alerts: ${JSON.stringify(alerts.rows)}
Quality inspections: ${JSON.stringify(quality.rows.slice(0, 5))}

Return JSON: { "executive_narrative": "", "overall_score": 0, "on_time_rate": ${onTimeRate || 0}, "defect_rate": 0, "risk_score": ${s.risk_score || 0}, "trend": "improving|stable|declining", "recommendations": [], "strengths": [], "concerns": [] }`;

    const { content, tokens, latency } = await callAI(prompt, false);
    const scorecard = parseAIJson(content) || { raw: content };

    await persistAIResult(req.user?.id, 'supplier-scorecard', { supplier_id: id }, scorecard, tokens, latency);
    res.json({ supplier: s, scorecard, type: 'supplier_scorecard', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// AI Usage Stats (NEW)
router.get('/usage-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        endpoint,
        COUNT(*) AS call_count,
        AVG(tokens_used) AS avg_tokens,
        SUM(tokens_used) AS total_tokens,
        AVG(latency_ms) AS avg_latency_ms,
        MAX(created_at) AS last_called
      FROM ai_results
      WHERE user_id = $1
      GROUP BY endpoint
      ORDER BY call_count DESC
    `, [req.user?.id]);

    // Estimate costs (claude-3-5-sonnet: ~$3/1M input, $15/1M output - approx $9/1M avg)
    const statsWithCost = result.rows.map(row => ({
      ...row,
      estimated_cost_usd: ((parseInt(row.total_tokens) || 0) * 9 / 1_000_000).toFixed(4)
    }));

    const total = await pool.query(
      'SELECT SUM(tokens_used) as total_tokens, COUNT(*) as total_calls FROM ai_results WHERE user_id = $1',
      [req.user?.id]
    );

    res.json({
      per_endpoint: statsWithCost,
      totals: {
        total_calls: parseInt(total.rows[0].total_calls) || 0,
        total_tokens: parseInt(total.rows[0].total_tokens) || 0,
        estimated_total_cost_usd: (((parseInt(total.rows[0].total_tokens) || 0) * 9) / 1_000_000).toFixed(4)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Predictive quality issues
router.post('/predict-quality-issues', aiRateLimiter, async (req, res) => {
  try {
    const { supplierId, productCategory } = req.body;
    const quality = await pool.query('SELECT * FROM quality_records ORDER BY created_at DESC LIMIT 30').catch(() => ({ rows: [] }));
    const suppliers = await pool.query('SELECT name, country, risk_score, category FROM suppliers LIMIT 30').catch(() => ({ rows: [] }));

    const prompt = `You are a supply chain quality risk analyst. Predict likely quality issues. Return JSON only.

Quality records: ${JSON.stringify(quality.rows.slice(0, 15))}
Suppliers: ${JSON.stringify(suppliers.rows.slice(0, 15))}
Filter: supplierId=${supplierId || 'all'}, category=${productCategory || 'all'}

Return JSON:
{
  "risk_level": "low|medium|high|critical",
  "predicted_issues": [{"supplier_id": <id>, "issue": "...", "probability_pct": <0-100>, "expected_impact": "...", "lead_time_days": <number>}],
  "preventive_actions": ["..."],
  "watch_list": [<supplier_id>],
  "summary": "..."
}`;
    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'predict-quality-issues', { supplierId, productCategory }, parsed, tokens, latency);
    res.json({ analysis: content, parsed, type: 'quality_prediction', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Network optimization — facility/sourcing point recommendations
router.post('/optimize-network', aiRateLimiter, async (req, res) => {
  try {
    const { objective } = req.body;
    const warehouses = await pool.query('SELECT * FROM warehouses LIMIT 30').catch(() => ({ rows: [] }));
    const suppliers = await pool.query('SELECT name, country, category, risk_score FROM suppliers LIMIT 30').catch(() => ({ rows: [] }));
    const shipments = await pool.query('SELECT origin, destination, status, transit_days FROM shipments ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] }));

    const prompt = `You are a supply chain network designer. Recommend network changes (facility locations / sourcing points) to optimize for ${objective || 'cost & service balance'}. Return JSON only.

Warehouses: ${JSON.stringify(warehouses.rows.slice(0, 10))}
Suppliers: ${JSON.stringify(suppliers.rows.slice(0, 15))}
Recent shipments: ${JSON.stringify(shipments.rows.slice(0, 20))}

Return JSON:
{
  "current_network_score": <0-100>,
  "recommendations": [{"action": "open|close|relocate|consolidate", "facility_or_supplier": "...", "rationale": "...", "estimated_savings_usd": <number>, "service_impact": "improved|neutral|degraded"}],
  "single_source_risks": ["..."],
  "expected_savings_pct": <0-100>,
  "summary": "..."
}`;
    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'optimize-network', { objective }, parsed, tokens, latency);
    res.json({ analysis: content, parsed, type: 'network_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Last-mile delivery optimization
router.post('/optimize-last-mile', aiRateLimiter, async (req, res) => {
  try {
    const { region, vehicleCount, serviceWindow, priority, constraints } = req.body || {};
    const shipments = await pool.query(
      "SELECT origin, destination, status, transit_days, weight_kg, priority FROM shipments WHERE status IN ('in_transit','out_for_delivery','pending') ORDER BY created_at DESC LIMIT 60"
    ).catch(() => ({ rows: [] }));
    const warehouses = await pool.query('SELECT name, location, capacity FROM warehouses LIMIT 20').catch(() => ({ rows: [] }));

    const prompt = `You are a last-mile logistics optimizer. Plan an optimized last-mile delivery sequence and resource allocation. Return JSON only.

Region: ${region || 'unspecified'}
Available vehicles: ${vehicleCount || 'unspecified'}
Service window: ${serviceWindow || '08:00-18:00'}
Optimization priority: ${priority || 'cost & on-time balance'}
Constraints: ${constraints || 'standard last-mile'}

Active/pending shipments (${shipments.rows.length}): ${JSON.stringify(shipments.rows.slice(0, 25))}
Warehouses (${warehouses.rows.length}): ${JSON.stringify(warehouses.rows.slice(0, 10))}

Return JSON:
{
  "current_efficiency_score": <0-100>,
  "recommended_routes": [{"vehicle_id": "<string>", "stops": [{"address":"...","eta":"HH:MM","priority":"high|med|low"}], "expected_distance_km": <number>, "expected_duration_min": <number>}],
  "consolidation_opportunities": ["..."],
  "delivery_window_optimizations": ["..."],
  "expected_savings_pct": <0-100>,
  "expected_on_time_rate_pct": <0-100>,
  "carbon_reduction_kg": <number>,
  "notes": ["..."],
  "summary": "1-2 sentence executive summary"
}`;
    const { content, tokens, latency } = await callAI(prompt);
    const parsed = parseAIJson(content) || { raw: content };
    await persistAIResult(req.user?.id, 'optimize-last-mile', { region, vehicleCount, priority }, parsed, tokens, latency);
    res.json({ analysis: content, parsed, type: 'last_mile_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    if (err.status === 503) return res.status(503).json({ error: err.message });
    res.status(500).json({ error: 'AI service error' });
  }
});

module.exports = router;
