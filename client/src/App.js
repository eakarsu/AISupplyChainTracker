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
import ShipmentMap from './pages/ShipmentMap';
import WeeklyPlan from './pages/WeeklyPlan';
import AIUsageStats from './pages/AIUsageStats';
import PredictQualityIssues from './pages/PredictQualityIssues';
import OptimizeNetwork from './pages/OptimizeNetwork';
import OptimizeLastMile from './pages/OptimizeLastMile';
import DetentionDemurrageExposure from './pages/DetentionDemurrageExposure';
import Sidebar from './components/Sidebar';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// === Batch 08 Gaps & Frontend Mounts ===
import CfPredictiveQualityIssuesFlaggingSuppliersRoutesWith from './pages/CfPredictiveQualityIssuesFlaggingSuppliersRoutesWith'
import CfNetworkOptimizationRecommendingFacilitySourcingLocations from './pages/CfNetworkOptimizationRecommendingFacilitySourcingLocations'
import CfLastMileDeliveryOptimizationWithRouteAnd from './pages/CfLastMileDeliveryOptimizationWithRouteAnd'
import CfBlockchainTraceabilityForHighValueRegulatedShipments from './pages/CfBlockchainTraceabilityForHighValueRegulatedShipments'
import CfSupplierCollaborationPortalWithExceptionEscalation from './pages/CfSupplierCollaborationPortalWithExceptionEscalation'
import CfIotSensorStreamIngestionForColdChain from './pages/CfIotSensorStreamIngestionForColdChain'
import GapNoAiDrivenNetworkOptimizationFacilitySourcing from './pages/GapNoAiDrivenNetworkOptimizationFacilitySourcing'
import GapNoPredictiveQualityScoring from './pages/GapNoPredictiveQualityScoring'
import GapNoAiDrivenFreightCostOptimization from './pages/GapNoAiDrivenFreightCostOptimization'
import GapNoIotSensorIngestionTemperatureHumidityFor from './pages/GapNoIotSensorIngestionTemperatureHumidityFor'
import GapNoCustomerPortalForShipmentVisibility from './pages/GapNoCustomerPortalForShipmentVisibility'
import GapNo3plIntegration from './pages/GapNo3plIntegration'
import GapNoFreightCostAnalytics from './pages/GapNoFreightCostAnalytics'
import GapNoWebhooksOrExternalNotifications from './pages/GapNoWebhooksOrExternalNotifications'
import GapNoAuditLog from './pages/GapNoAuditLog'
import GapNoMultiTenantOperatorSeparation from './pages/GapNoMultiTenantOperatorSeparation'

const appStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #64748b; }
`;

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

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
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-predictive-quality-issues-flagging-suppliers-routes-with-quality" element={<ProtectedRoute><CfPredictiveQualityIssuesFlaggingSuppliersRoutesWith /></ProtectedRoute>} />
      <Route path="/cf-network-optimization-recommending-facility-sourcing-locations" element={<ProtectedRoute><CfNetworkOptimizationRecommendingFacilitySourcingLocations /></ProtectedRoute>} />
      <Route path="/cf-last-mile-delivery-optimization-with-route-and-consolidation-recommendations" element={<ProtectedRoute><CfLastMileDeliveryOptimizationWithRouteAnd /></ProtectedRoute>} />
      <Route path="/cf-blockchain-traceability-for-high-value-regulated-shipments" element={<ProtectedRoute><CfBlockchainTraceabilityForHighValueRegulatedShipments /></ProtectedRoute>} />
      <Route path="/cf-supplier-collaboration-portal-with-exception-escalation" element={<ProtectedRoute><CfSupplierCollaborationPortalWithExceptionEscalation /></ProtectedRoute>} />
      <Route path="/cf-iot-sensor-stream-ingestion-for-cold-chain-compliance" element={<ProtectedRoute><CfIotSensorStreamIngestionForColdChain /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-network-optimization-facility-sourcing-point-placement" element={<ProtectedRoute><GapNoAiDrivenNetworkOptimizationFacilitySourcing /></ProtectedRoute>} />
      <Route path="/gap-no-predictive-quality-scoring" element={<ProtectedRoute><GapNoPredictiveQualityScoring /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-freight-cost-optimization" element={<ProtectedRoute><GapNoAiDrivenFreightCostOptimization /></ProtectedRoute>} />
      <Route path="/gap-no-iot-sensor-ingestion-temperature-humidity-for-cold" element={<ProtectedRoute><GapNoIotSensorIngestionTemperatureHumidityFor /></ProtectedRoute>} />
      <Route path="/gap-no-customer-portal-for-shipment-visibility" element={<ProtectedRoute><GapNoCustomerPortalForShipmentVisibility /></ProtectedRoute>} />
      <Route path="/gap-no-3pl-integration" element={<ProtectedRoute><GapNo3plIntegration /></ProtectedRoute>} />
      <Route path="/gap-no-freight-cost-analytics" element={<ProtectedRoute><GapNoFreightCostAnalytics /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-or-external-notifications" element={<ProtectedRoute><GapNoWebhooksOrExternalNotifications /></ProtectedRoute>} />
      <Route path="/gap-no-audit-log" element={<ProtectedRoute><GapNoAuditLog /></ProtectedRoute>} />
      <Route path="/gap-no-multi-tenant-operator-separation" element={<ProtectedRoute><GapNoMultiTenantOperatorSeparation /></ProtectedRoute>} />
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
                <Route path="/shipment-map" element={<ShipmentMap />} />
                <Route path="/weekly-plan" element={<WeeklyPlan />} />
                <Route path="/ai-usage" element={<AIUsageStats />} />
                <Route path="/predict-quality" element={<PredictQualityIssues />} />
                <Route path="/optimize-network" element={<OptimizeNetwork />} />
                <Route path="/optimize-last-mile" element={<OptimizeLastMile />} />
                <Route path="/detention-demurrage-exposure" element={<DetentionDemurrageExposure />} />
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
