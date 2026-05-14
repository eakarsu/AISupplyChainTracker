const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

function parseAIJson(content) {
  try { return JSON.parse(content); } catch {}
  try {
    const first = content.indexOf('{'), last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1) return JSON.parse(content.slice(first, last + 1));
  } catch {}
  return null;
}

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM disruptions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM disruptions')
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM disruptions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST - creates disruption, triggers AI risk assessment, auto-creates risk_alert if severity=high/critical
router.post('/', async (req, res) => {
  try {
    const { title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy } = req.body;
    const result = await pool.query(
      `INSERT INTO disruptions (title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy]
    );

    const disruption = result.rows[0];
    const io = req.app.locals.io;

    // Auto-create risk_alert and run AI assessment for high-severity disruptions
    if (['high', 'critical'].includes(severity)) {
      // Create risk alert
      pool.query(
        `INSERT INTO risk_alerts (alert_type, severity, affected_entity, description, status)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        ['disruption', severity, affected_suppliers || region || title, description, 'active']
      ).catch(console.error);

      // AI risk assessment (async, don't block response)
      if (process.env.OPENROUTER_API_KEY) {
        axios.post(
          (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions',
          {
            model: 'anthropic/claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: `Assess this ${severity} disruption: ${title}. Region: ${region}. Description: ${description}. Provide brief risk assessment and top 3 mitigation actions. Return JSON: { "risk_assessment": "", "mitigation_actions": [], "estimated_impact": "" }` }],
            max_tokens: 500
          },
          { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 }
        ).then(aiRes => {
          const content = aiRes.data.choices[0].message.content;
          const parsed = parseAIJson(content);
          if (parsed) {
            pool.query(
              'INSERT INTO ai_results (endpoint, input_data, result) VALUES ($1, $2, $3)',
              ['auto-disruption-assessment', JSON.stringify({ disruption_id: disruption.id }), JSON.stringify(parsed)]
            ).catch(console.error);
          }
          // Emit WebSocket notification for high severity
          if (io) {
            io.emit('high-severity-disruption', {
              disruption,
              ai_assessment: parsed || { raw: content },
              timestamp: new Date().toISOString()
            });
          }
        }).catch(err => console.error('Auto-assessment error:', err.message));
      } else if (io) {
        // Still emit even without AI
        io.emit('high-severity-disruption', { disruption, timestamp: new Date().toISOString() });
      }
    }

    res.status(201).json(disruption);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy } = req.body;
    const result = await pool.query(
      `UPDATE disruptions SET title=$1, type=$2, severity=$3, region=$4, description=$5, impact_score=$6, probability=$7, affected_suppliers=$8, estimated_duration_days=$9, mitigation_strategy=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, type, severity, region, description, impact_score, probability, affected_suppliers, estimated_duration_days, mitigation_strategy, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM disruptions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Disruption not found' });
    res.json({ message: 'Disruption deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
