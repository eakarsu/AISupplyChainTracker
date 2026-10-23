import React, { useEffect, useState } from 'react';
// Labelled feature-pack panel: tasks, search/filter, export, deterministic AI.
// formatValue preserves false / 0 / empty instead of hiding them behind a fallback.
export function formatValue(v) {
  if (v === false) return 'false';
  if (v === 0) return '0';
  if (v === '' || v === null || v === undefined) return '(empty)';
  return String(v);
}
export default function FeaturePackPanel() {
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const [title, setTitle] = useState(''); const [error, setError] = useState('');
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
  async function load() {
    try {
      const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
      const r = await fetch(`/api/tasks?${qs}`, { headers: headers() });
      const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Failed to load tasks');
      setTasks(body.data || []);
      const slugs = ['delay-risk', 'route-priority', 'disruption-summary'];
      const out = [];
      for (const s of slugs) { const ir = await fetch(`/api/tasks/ai/${s}`, { headers: headers() }); if (ir.ok) out.push(await ir.json()); }
      setInsights(out);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);
  async function create(e) { e.preventDefault(); const r = await fetch('/api/tasks', { method: 'POST', headers: headers(), body: JSON.stringify({ title, status: 'open', value: 0, flagged: false }) }); if (r.ok) { setTitle(''); load(); } }
  async function markDone(t) { await fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ status: 'done' }) }); load(); }
  return (
    <section aria-label="Supply Chain Tracking tasks and insights">
      <h2>Supply Chain Tracking — Tasks</h2>
      {error ? <p role="alert">Error: {formatValue(error)}</p> : null}
      <form onSubmit={create}><label>New task title <input value={title} onChange={e => setTitle(e.target.value)} required /></label><button type="submit">Create task</button></form>
      <div><label>Search <input value={q} onChange={e => setQ(e.target.value)} /></label>
      <label>Status filter <select value={status} onChange={e => setStatus(e.target.value)}><option value="">(all)</option><option value="open">open</option><option value="done">done</option></select></label>
      <button type="button" onClick={load}>Apply search &amp; filters</button>
      <a href="/api/tasks/export?format=csv">Export CSV</a> <a href="/api/tasks/export?format=json">Export JSON</a></div>
      <h3>Task list</h3>
      {tasks.length === 0 ? <p>Task list: (empty)</p> : tasks.map(t => (
        <article key={t.id}><h4>Title: {formatValue(t.title)}</h4>
          <p>Status: {formatValue(t.status)}</p><p>Priority: {formatValue(t.priority)}</p><p>Category: {formatValue(t.category)}</p>
          <p>Value: {formatValue(t.value)}</p><p>Score: {formatValue(t.score)}</p><p>Flagged: {formatValue(t.flagged)}</p><p>Notes: {formatValue(t.notes)}</p>
          <button type="button" onClick={() => markDone(t)}>Mark done</button></article>))}
      <h3>AI insights — deterministic fallback (aiGenerated: false)</h3>
      {insights.length === 0 ? <p>AI insights: (empty)</p> : insights.map((r, i) => (
        <article key={i}><h4>{formatValue(r.label)}</h4>
          <p>aiGenerated: {formatValue(r.aiGenerated)}</p><p>Source: {formatValue(r.source)}</p>
          <p>Count: {formatValue(r.count)}</p><p>Open count: {formatValue(r.openCount)}</p><p>Total value: {formatValue(r.totalValue)}</p>
          <p>Average score: {formatValue(r.averageScore)}</p><p>High-priority count: {formatValue(r.highPriorityCount)}</p><p>Flagged count: {formatValue(r.flaggedCount)}</p>
          <p>Recommendation: {formatValue(r.recommendation)}</p><p>Summary: {formatValue(r.summary)}</p></article>))}
    </section>
  );
}
