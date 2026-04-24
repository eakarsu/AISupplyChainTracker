const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function callAI(prompt) {
  try {
    const response = await axios.post(
      `${OPENROUTER_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Supply Chain Tracker',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI API Error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'AI service unavailable');
  }
}

// Disruption Prediction
router.post('/predict-disruption', async (req, res) => {
  try {
    const { region, supplierData, context } = req.body;
    let dataContext = '';
    if (!context) {
      const disruptions = await pool.query('SELECT * FROM disruptions ORDER BY created_at DESC LIMIT 10');
      const suppliers = await pool.query('SELECT name, country, risk_score, category FROM suppliers WHERE country ILIKE $1 OR $1 IS NULL LIMIT 10', [region || null]);
      dataContext = `Current disruptions: ${JSON.stringify(disruptions.rows)}\nSuppliers in region: ${JSON.stringify(suppliers.rows)}`;
    }

    const prompt = `You are a supply chain disruption prediction AI analyst. Analyze the following data and predict potential disruptions.

${context || dataContext}
${region ? `Focus region: ${region}` : ''}
${supplierData ? `Supplier context: ${supplierData}` : ''}

Provide your analysis in the following structured format:
1. **Risk Assessment**: Overall risk level (Low/Medium/High/Critical) with explanation
2. **Predicted Disruptions**: List 3-5 potential disruptions with probability percentages
3. **Impact Analysis**: How each disruption could affect the supply chain
4. **Recommended Actions**: Specific mitigation strategies for each risk
5. **Timeline**: Expected timeframe for each predicted disruption
6. **Confidence Score**: Your confidence in this prediction (0-100%)

Be specific, data-driven, and actionable in your recommendations.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'disruption_prediction', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Supplier Risk Assessment
router.post('/assess-supplier-risk', async (req, res) => {
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

    const prompt = `You are a supplier risk assessment AI. Analyze the following supplier data and provide a comprehensive risk assessment.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Overall Risk Rating**: Score out of 100 with color-coded level
2. **Financial Risk**: Assessment of financial stability
3. **Geopolitical Risk**: Country/region specific risks
4. **Operational Risk**: Capacity and reliability concerns
5. **Compliance Risk**: Regulatory and compliance issues
6. **Recommendations**: Top 5 actionable recommendations
7. **Alternative Suppliers**: Suggest backup supplier strategies
8. **Monitoring Plan**: Key metrics to watch

Be thorough and provide specific, actionable insights.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'supplier_risk', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Route Optimization
router.post('/optimize-route', async (req, res) => {
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

    const prompt = `You are a logistics route optimization AI. Analyze the following shipping routes and provide optimization recommendations.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Current Efficiency Score**: Rate the current route efficiency (0-100%)
2. **Cost Optimization**: How to reduce shipping costs with specific percentages
3. **Time Optimization**: How to reduce delivery times
4. **Carbon Footprint Reduction**: Environmental impact improvements
5. **Alternative Routes**: Suggest 3 alternative route options with pros/cons
6. **Risk Mitigation**: How to handle route disruptions
7. **Seasonal Adjustments**: Recommendations based on seasonal patterns
8. **Estimated Savings**: Projected annual savings from optimizations

Provide specific, data-driven recommendations with estimated impact percentages.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'route_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Demand Forecasting
router.post('/forecast-demand', async (req, res) => {
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

    const prompt = `You are a demand forecasting AI analyst. Analyze the following data and provide demand predictions.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Demand Trend**: Current direction (Growing/Stable/Declining) with percentage
2. **30-Day Forecast**: Predicted demand for the next month with confidence interval
3. **90-Day Forecast**: Predicted demand for the next quarter
4. **Seasonal Patterns**: Identified seasonal influences
5. **Market Factors**: External factors affecting demand
6. **Inventory Recommendations**: Optimal stock levels to maintain
7. **Risk Factors**: Potential demand disruption risks
8. **Opportunity Areas**: Growth opportunities to capitalize on

Be specific with numbers and percentages where possible.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'demand_forecast', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// General Supply Chain Analysis
router.post('/analyze', async (req, res) => {
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

    const prompt = `You are an AI supply chain analyst. ${query || 'Provide a comprehensive analysis of the current supply chain status.'}

Data context: ${context || dataContext}

Provide a professional, insightful analysis with actionable recommendations. Format your response with clear sections using markdown-style headers (**bold**) and bullet points.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'general_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Inventory Optimization
router.post('/optimize-inventory', async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const inventory = await pool.query('SELECT * FROM inventory ORDER BY quantity ASC LIMIT 15');
      dataContext = `Current inventory: ${JSON.stringify(inventory.rows)}`;
    }

    const prompt = `You are an inventory optimization AI. Analyze the following inventory data and provide optimization recommendations.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Inventory Health Score**: Overall inventory health (0-100%)
2. **Low Stock Alerts**: Items that need immediate restocking
3. **Overstock Items**: Items with excess inventory
4. **Reorder Recommendations**: Optimal reorder quantities and timing
5. **Cost Optimization**: How to reduce carrying costs
6. **ABC Analysis**: Categorize items by importance
7. **Demand-Supply Alignment**: How well inventory matches demand
8. **Action Items**: Top 5 immediate actions to take

Be specific with quantities and timelines.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'inventory_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Warehouse Optimization
router.post('/optimize-warehouse', async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const warehouses = await pool.query('SELECT * FROM warehouses ORDER BY created_at DESC LIMIT 15');
      dataContext = `Warehouses: ${JSON.stringify(warehouses.rows)}`;
    }

    const prompt = `You are a warehouse optimization AI. Analyze the following warehouse data and provide optimization recommendations.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Utilization Score**: Overall warehouse utilization efficiency (0-100%)
2. **Capacity Alerts**: Warehouses nearing capacity or underutilized
3. **Layout Optimization**: Suggestions for improving warehouse layouts
4. **Inventory Distribution**: How to better distribute inventory across warehouses
5. **Cost Reduction**: Ways to reduce warehousing costs
6. **Automation Opportunities**: Where to implement automation
7. **Safety & Compliance**: Warehouse safety recommendations
8. **Action Plan**: Top 5 immediate improvements

Be specific with percentages and actionable recommendations.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'warehouse_optimization', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Compliance Analysis
router.post('/analyze-compliance', async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const compliance = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC LIMIT 15');
      dataContext = `Compliance records: ${JSON.stringify(compliance.rows)}`;
    }

    const prompt = `You are a supply chain compliance AI analyst. Analyze the following compliance data and provide recommendations.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Compliance Health Score**: Overall compliance status (0-100%)
2. **Critical Gaps**: Areas with compliance gaps requiring immediate attention
3. **Expiring Certifications**: Certifications/audits due for renewal
4. **Risk Areas**: Regulatory risks by region/category
5. **Audit Recommendations**: Suggested audit priorities
6. **Regulatory Updates**: Important regulatory changes to watch
7. **Corrective Actions**: Required corrective measures
8. **Compliance Roadmap**: 90-day improvement plan

Be thorough and specific about regulatory requirements.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'compliance_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Quality Analysis
router.post('/analyze-quality', async (req, res) => {
  try {
    const { context } = req.body;
    let dataContext = '';
    if (!context) {
      const quality = await pool.query('SELECT * FROM quality_inspections ORDER BY created_at DESC LIMIT 15');
      dataContext = `Quality inspections: ${JSON.stringify(quality.rows)}`;
    }

    const prompt = `You are a quality control AI analyst. Analyze the following inspection data and provide quality improvement recommendations.

${context || dataContext}

Provide your analysis in the following structured format:
1. **Quality Score**: Overall quality rating (0-100%)
2. **Defect Trends**: Patterns in defects and failure modes
3. **Supplier Quality Ranking**: Quality performance by supplier
4. **Root Cause Analysis**: Likely root causes for recurring defects
5. **Process Improvements**: Recommended process changes
6. **Inspection Optimization**: How to improve inspection efficiency
7. **Cost of Quality**: Estimated cost impact of quality issues
8. **Improvement Plan**: Prioritized quality improvement actions

Be data-driven and specific about defect patterns.`;

    const aiResponse = await callAI(prompt);
    res.json({ analysis: aiResponse, type: 'quality_analysis', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
