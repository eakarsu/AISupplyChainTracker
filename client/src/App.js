import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Suppliers from './pages/Suppliers';
import Disruptions from './pages/Disruptions';
import Inventory from './pages/Inventory';
import RiskAlerts from './pages/RiskAlerts';
import RouteOptimization from './pages/RouteOptimization';
import DemandForecasting from './pages/DemandForecasting';
import PurchaseOrders from './pages/PurchaseOrders';
import Warehouses from './pages/Warehouses';
import Compliance from './pages/Compliance';
import QualityControl from './pages/QualityControl';
import Analytics from './pages/Analytics';
import FleetAgents from './pages/FleetAgents';
import Sidebar from './components/Sidebar';

const appStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #64748b; }
`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <>
      <style>{appStyles}</style>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <Router>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar user={user} onLogout={handleLogout} />
            <main style={{ flex: 1, marginLeft: '260px', padding: '24px', minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/disruptions" element={<Disruptions />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/alerts" element={<RiskAlerts />} />
                <Route path="/routes" element={<RouteOptimization />} />
                <Route path="/demand" element={<DemandForecasting />} />
                <Route path="/orders" element={<PurchaseOrders />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/quality" element={<QualityControl />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/fleet-agents" element={<FleetAgents />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        )}
      </Router>
    </>
  );
}

export default App;
