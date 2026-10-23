'use strict';
// Authenticated tasks + search/filter + CSV/JSON export + deterministic AI.
// Offline fallback only: aiGenerated is always false; no provider is called.
const express = require('express');
const auth = require('../middleware/auth');
const fp = require('../featurePack');
const router = express.Router();
const store = fp.createStore();
router.get('/export', auth, (req, res) => {
  const rows = store.list(fp.ownerKey(req.user), req.query);
  if (String(req.query.format || 'csv').toLowerCase() === 'json') { res.set('Content-Type', 'application/json'); return res.send(fp.toJson(rows)); }
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="tasks_export.csv"' });
  return res.send(fp.toCsv(rows));
});
router.get('/', auth, (req, res) => res.json({ data: store.list(fp.ownerKey(req.user), req.query), aiGenerated: false }));
router.post('/', auth, (req, res) => { try { return res.status(201).json(store.create(fp.ownerKey(req.user), req.body || {})); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); } });
router.put('/:id', auth, (req, res) => { const t = store.update(fp.ownerKey(req.user), req.params.id, req.body || {}); return t ? res.json(t) : res.status(404).json({ error: 'Task not found' }); });
router.get('/:id', auth, (req, res) => { const t = store.get(fp.ownerKey(req.user), req.params.id); return t ? res.json(t) : res.status(404).json({ error: 'Task not found' }); });
router.get('/ai/delay-risk', auth, (req, res) => res.json(fp.delayRisk(store.list(fp.ownerKey(req.user), req.query))));
router.get('/ai/route-priority', auth, (req, res) => res.json(fp.routePriority(store.list(fp.ownerKey(req.user), req.query))));
router.get('/ai/disruption-summary', auth, (req, res) => res.json(fp.disruptionSummary(store.list(fp.ownerKey(req.user), req.query))));
module.exports = router;
