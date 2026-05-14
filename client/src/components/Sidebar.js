import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiTruck, FiUsers, FiAlertTriangle, FiPackage, FiShield, FiMap, FiTrendingUp, FiShoppingCart, FiLogOut, FiGrid, FiFileText, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/shipments', label: 'Shipment Tracking', icon: FiTruck },
  { path: '/suppliers', label: 'Suppliers', icon: FiUsers },
  { path: '/disruptions', label: 'Disruptions', icon: FiAlertTriangle },
  { path: '/inventory', label: 'Inventory', icon: FiPackage },
  { path: '/alerts', label: 'Risk Alerts', icon: FiShield },
  { path: '/routes', label: 'Route Optimization', icon: FiMap },
  { path: '/demand', label: 'Demand Forecasting', icon: FiTrendingUp },
  { path: '/orders', label: 'Purchase Orders', icon: FiShoppingCart },
  { path: '/warehouses', label: 'Warehouses', icon: FiGrid },
  { path: '/compliance', label: 'Compliance', icon: FiFileText },
  { path: '/quality', label: 'Quality Control', icon: FiCheckCircle },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/fleet-agents', label: 'Fleet Agents', icon: FiTruck },
  { path: '/predict-quality', label: 'Predict Quality Issues', icon: FiAlertTriangle },
  { path: '/optimize-network', label: 'Network Optimization', icon: FiMap },
  { path: '/optimize-last-mile', label: 'Last-Mile Optimization', icon: FiTruck },
];

const styles = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px',
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column',
    zIndex: 100, overflowY: 'auto',
  },
  logo: {
    padding: '24px 20px', borderBottom: '1px solid #334155',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  logoIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: '700', color: '#fff',
  },
  logoText: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9' },
  logoSub: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 8px' },
  menuItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
    color: active ? '#f1f5f9' : '#94a3b8', fontSize: '14px', fontWeight: active ? '600' : '400',
    background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.1))' : 'transparent',
    border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
    transition: 'all 0.2s', marginBottom: '2px',
  }),
  footer: {
    padding: '16px 20px', borderTop: '1px solid #334155',
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '600', color: '#fff',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
    padding: '8px 12px', border: '1px solid #334155', borderRadius: '8px',
    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
    fontSize: '13px', transition: 'all 0.2s',
  },
};

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>SC</div>
        <div>
          <div style={styles.logoText}>Supply Chain AI</div>
          <div style={styles.logoSub}>Intelligent Tracking</div>
        </div>
      </div>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            style={styles.menuItem(location.pathname === item.path)}
            onClick={() => navigate(item.path)}
            onMouseEnter={(e) => { if (location.pathname !== item.path) e.currentTarget.style.background = 'rgba(51,65,85,0.5)'; }}
            onMouseLeave={(e) => { if (location.pathname !== item.path) e.currentTarget.style.background = 'transparent'; }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{user?.role || 'admin'}</div>
          </div>
        </div>
        <button
          style={styles.logoutBtn}
          onClick={onLogout}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <FiLogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
