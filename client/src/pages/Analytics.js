import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { FiBarChart2, FiCpu } from 'react-icons/fi';
import API from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  icon: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: '24px', fontWeight: '800', color: '#f1f5f9' },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  aiBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    borderRadius: '10px', border: '1px solid rgba(139,92,246,0.3)',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
    color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card: {
    background: '#1e293b', borderRadius: '16px', border: '1px solid #334155',
    padding: '20px', overflow: 'hidden',
  },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' },
  cardSub: { fontSize: '12px', color: '#64748b', marginBottom: '16px' },
  fullWidth: { gridColumn: '1 / -1' },
};

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', fontWeight: '600' },
};

function Analytics() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [shipStatus, supplierRisk, invCategory, disruptionType, demandTrends, routeEff, orderStatus, alertSev, warehouseUtil, qualitySummary] = await Promise.all([
          API.get('/analytics/shipment-status'),
          API.get('/analytics/supplier-risk'),
          API.get('/analytics/inventory-by-category'),
          API.get('/analytics/disruption-by-type'),
          API.get('/analytics/demand-trends'),
          API.get('/analytics/route-efficiency'),
          API.get('/analytics/order-status'),
          API.get('/analytics/alerts-by-severity'),
          API.get('/analytics/warehouse-utilization'),
          API.get('/analytics/quality-summary'),
        ]);
        setData({
          shipStatus: shipStatus.data,
          supplierRisk: supplierRisk.data,
          invCategory: invCategory.data,
          disruptionType: disruptionType.data,
          demandTrends: demandTrends.data,
          routeEff: routeEff.data,
          orderStatus: orderStatus.data,
          alertSev: alertSev.data,
          warehouseUtil: warehouseUtil.data,
          qualitySummary: qualitySummary.data,
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const runAI = async () => {
    setAiOpen(true);
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze', {
        query: 'Provide a comprehensive analytics report of the entire supply chain. Include insights on shipment performance, supplier risks, inventory health, disruption trends, demand patterns, route efficiency, and quality metrics. Highlight key KPIs and recommend data-driven improvements.',
        context: JSON.stringify(data),
      });
      setAiAnalysis(res.data);
    } catch (err) {
      setAiAnalysis({ analysis: 'Error: ' + (err.response?.data?.error || err.message), type: 'error', timestamp: new Date().toISOString() });
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.icon}><FiBarChart2 size={24} color="#fff" /></div>
          <div>
            <div style={styles.title}>Analytics & Reports</div>
            <div style={styles.subtitle}>Visual insights across your entire supply chain</div>
          </div>
        </div>
        <button style={styles.aiBtn} onClick={runAI}><FiCpu size={16} /> AI Insights</button>
      </div>

      <div style={styles.grid}>
        {/* Shipment Status Distribution */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Shipment Status Distribution</div>
          <div style={styles.cardSub}>Current status breakdown of all shipments</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.shipStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status} (${count})`} labelLine={false}>
                {(data.shipStatus || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Purchase Order Status</div>
          <div style={styles.cardSub}>Order distribution by status with total values</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.orderStatus || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="total_value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Supplier Risk Scores */}
        <div style={{ ...styles.card, ...styles.fullWidth }}>
          <div style={styles.cardTitle}>Supplier Risk Scores</div>
          <div style={styles.cardSub}>Risk scores across all suppliers (higher = more risky)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.supplierRisk || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="risk_score" radius={[0, 4, 4, 0]}>
                {(data.supplierRisk || []).map((entry, i) => (
                  <Cell key={i} fill={parseFloat(entry.risk_score) > 7 ? '#ef4444' : parseFloat(entry.risk_score) > 5 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory by Category */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Inventory Value by Category</div>
          <div style={styles.cardSub}>Total inventory value distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.invCategory || []} dataKey="total_value" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ category }) => category}>
                {(data.invCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Disruption Types */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Disruptions by Type</div>
          <div style={styles.cardSub}>Number of disruptions and average impact by category</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.disruptionType || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Demand Trends */}
        <div style={{ ...styles.card, ...styles.fullWidth }}>
          <div style={styles.cardTitle}>Demand Forecast: Current vs Predicted</div>
          <div style={styles.cardSub}>Comparison of current demand against AI predictions</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={(data.demandTrends || []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="product_name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="current_demand" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" name="Current" />
              <Area type="monotone" dataKey="predicted_demand" stroke="#10b981" fill="rgba(16,185,129,0.2)" name="Predicted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Route Efficiency */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Route Reliability Scores</div>
          <div style={styles.cardSub}>Shipping route reliability ratings</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={(data.routeEff || []).slice(0, 8).map(r => ({ ...r, route: r.route_name?.split(' ')[0] || r.route_name }))}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="route" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar dataKey="reliability_score" stroke="#8b5cf6" fill="rgba(139,92,246,0.3)" />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Severity */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Risk Alerts by Severity</div>
          <div style={styles.cardSub}>Distribution of alert severity levels</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.alertSev || []} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} label={({ severity, count }) => `${severity} (${count})`}>
                {(data.alertSev || []).map((entry, i) => {
                  const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
                  return <Cell key={i} fill={colors[entry.severity] || COLORS[i]} />;
                })}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Warehouse Utilization */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Warehouse Utilization</div>
          <div style={styles.cardSub}>Space utilization percentage per warehouse</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(data.warehouseUtil || []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-30} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="utilization_pct" radius={[4, 4, 0, 0]}>
                {(data.warehouseUtil || []).map((entry, i) => (
                  <Cell key={i} fill={parseFloat(entry.utilization_pct) > 80 ? '#ef4444' : parseFloat(entry.utilization_pct) > 60 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Summary */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Quality Inspection Results</div>
          <div style={styles.cardSub}>Pass/fail distribution of inspections</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.qualitySummary || []} dataKey="count" nameKey="result" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ result, count }) => `${result} (${count})`}>
                {(data.qualitySummary || []).map((entry, i) => {
                  const colors = { pass: '#10b981', fail: '#ef4444', conditional: '#f59e0b', pending: '#3b82f6' };
                  return <Cell key={i} fill={colors[entry.result] || COLORS[i]} />;
                })}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AIAnalysisPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        analysis={aiAnalysis}
        loading={aiLoading}
        title="AI Analytics Insights"
      />
    </div>
  );
}

export default Analytics;
