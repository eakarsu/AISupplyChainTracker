'use strict';
// Deterministic, offline feature-pack logic. Never calls a provider:
// no API keys are read and no network request is made by this module.
function ownerKey(user) {
  if (!user) return 'anonymous';
  const id = user.id || user.userId || user.sub || user.tenantId || 'unknown';
  return `${user.tenantId || 'no-tenant'}:${id}`;
}
function createStore() {
  const byOwner = new Map(); let seq = 0;
  function listFor(owner) { if (!byOwner.has(owner)) byOwner.set(owner, []); return byOwner.get(owner); }
  return {
    create(owner, data = {}) {
      const now = new Date().toISOString();
      const task = {
        id: ++seq,
        title: String(data.title || ''),
        description: String(data.description || ''),
        status: String(data.status || 'open'),
        priority: String(data.priority || 'medium'),
        category: String(data.category || ''),
        value: Number(data.value) || 0,
        score: Number(data.score) || 0,
        flagged: data.flagged === true,
        notes: String(data.notes || ''),
        owner, createdAt: now, updatedAt: now,
      };
      if (!task.title) { const e = new Error('title is required'); e.status = 400; throw e; }
      listFor(owner).push(task); return task;
    },
    list(owner, filters = {}) {
      let rows = [...listFor(owner)];
      const q = String(filters.q || '').trim().toLowerCase();
      if (q) rows = rows.filter(t => [t.title, t.description, t.category, t.status, t.priority, t.notes].join(' ').toLowerCase().includes(q));
      if (filters.status) rows = rows.filter(t => t.status === String(filters.status));
      if (filters.priority) rows = rows.filter(t => t.priority === String(filters.priority));
      if (filters.category) rows = rows.filter(t => t.category === String(filters.category));
      if (filters.flagged !== undefined && filters.flagged !== '') rows = rows.filter(t => t.flagged === (filters.flagged === true || filters.flagged === 'true'));
      return rows;
    },
    update(owner, id, data = {}) {
      const task = listFor(owner).find(t => t.id === Number(id));
      if (!task) return null;
      for (const k of ['title','description','status','priority','category','notes']) if (data[k] !== undefined) task[k] = String(data[k]);
      if (data.value !== undefined) task.value = Number(data.value) || 0;
      if (data.score !== undefined) task.score = Number(data.score) || 0;
      if (data.flagged !== undefined) task.flagged = data.flagged === true;
      task.updatedAt = new Date().toISOString(); return task;
    },
    get(owner, id) { return listFor(owner).find(t => t.id === Number(id)) || null; },
  };
}
function toCsv(rows) {
  const cols = ['id','title','description','status','priority','category','value','score','flagged','notes','createdAt','updatedAt'];
  const esc = v => `"${String(v === undefined || v === null ? '' : v).replace(/"/g,'""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
function toJson(rows) { return JSON.stringify(rows, null, 2); }
function fallback(label, extra) {
  return { aiGenerated: false, source: 'deterministic-fallback', label, ...extra };
}

function delayRisk(tasks) {
  const rows = Array.isArray(tasks) ? tasks : [];
  const open = rows.filter(t => t.status !== 'done' && t.status !== 'completed');
  const totalValue = rows.reduce((s,t) => s + (Number(t.value)||0), 0);
  const avgScore = rows.length ? rows.reduce((s,t)=>s+(Number(t.score)||0),0)/rows.length : 0;
  const high = rows.filter(t => t.priority === 'high').length;
  const flagged = rows.filter(t => t.flagged).length;
  return fallback('Shipment delay risk', { count: rows.length, openCount: open.length, totalValue, averageScore: avgScore, highPriorityCount: high, flaggedCount: flagged, recommendation: rows.length === 0 ? 'No records yet — create a task to see insights.' : (high > 0 ? `Review ${high} high-priority record(s) first.` : 'No high-priority records; proceed in due-date order.'), summary: `${rows.length} record(s), ${open.length} open, value ${totalValue}` });
}

function routePriority(tasks) {
  const rows = Array.isArray(tasks) ? tasks : [];
  const open = rows.filter(t => t.status !== 'done' && t.status !== 'completed');
  const totalValue = rows.reduce((s,t) => s + (Number(t.value)||0), 0);
  const avgScore = rows.length ? rows.reduce((s,t)=>s+(Number(t.score)||0),0)/rows.length : 0;
  const high = rows.filter(t => t.priority === 'high').length;
  const flagged = rows.filter(t => t.flagged).length;
  return fallback('Route priority', { count: rows.length, openCount: open.length, totalValue, averageScore: avgScore, highPriorityCount: high, flaggedCount: flagged, recommendation: rows.length === 0 ? 'No records yet — create a task to see insights.' : (high > 0 ? `Review ${high} high-priority record(s) first.` : 'No high-priority records; proceed in due-date order.'), summary: `${rows.length} record(s), ${open.length} open, value ${totalValue}` });
}

function disruptionSummary(tasks) {
  const rows = Array.isArray(tasks) ? tasks : [];
  const open = rows.filter(t => t.status !== 'done' && t.status !== 'completed');
  const totalValue = rows.reduce((s,t) => s + (Number(t.value)||0), 0);
  const avgScore = rows.length ? rows.reduce((s,t)=>s+(Number(t.score)||0),0)/rows.length : 0;
  const high = rows.filter(t => t.priority === 'high').length;
  const flagged = rows.filter(t => t.flagged).length;
  return fallback('Disruption summary', { count: rows.length, openCount: open.length, totalValue, averageScore: avgScore, highPriorityCount: high, flaggedCount: flagged, recommendation: rows.length === 0 ? 'No records yet — create a task to see insights.' : (high > 0 ? `Review ${high} high-priority record(s) first.` : 'No high-priority records; proceed in due-date order.'), summary: `${rows.length} record(s), ${open.length} open, value ${totalValue}` });
}
module.exports = { ownerKey, createStore, toCsv, toJson, delayRisk, routePriority, disruptionSummary };
