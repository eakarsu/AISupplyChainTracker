const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });

// Validate required env vars at startup
const requiredEnv = ['OPENROUTER_API_KEY', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.warn(`Warning: Missing env variables: ${missingEnv.join(', ')}`);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }
});

const PORT = process.env.SERVER_PORT || 3001;
const pool = require('./db');
const authMiddleware = require('./middleware/auth');

// Init ai_results table
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    input_data JSONB,
    result JSONB,
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// Make io available to routes
app.locals.io = io;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes - auth middleware applied to ALL data routes
app.use('/api/shipments', authMiddleware, require('./routes/shipments'));
app.use('/api/suppliers', authMiddleware, require('./routes/suppliers'));
app.use('/api/disruptions', authMiddleware, require('./routes/disruptions'));
app.use('/api/inventory', authMiddleware, require('./routes/inventory'));
app.use('/api/alerts', authMiddleware, require('./routes/alerts'));
app.use('/api/routes', authMiddleware, require('./routes/routeOptimization'));
app.use('/api/demand', authMiddleware, require('./routes/demand'));
app.use('/api/ai', authMiddleware, require('./routes/ai'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));
app.use('/api/warehouses', authMiddleware, require('./routes/warehouses'));
app.use('/api/compliance', authMiddleware, require('./routes/compliance'));
app.use('/api/quality', authMiddleware, require('./routes/quality'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));
app.use('/api/fleet-agents', authMiddleware, require('./routes/fleetAgents'));
app.use('/api/detention-demurrage-exposure', authMiddleware, require('./routes/detentionDemurrageExposure'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io - real-time disruption alerts
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.use('/api/predictive-quality-issues', require('./routes/predictiveQualityIssues')); app.use('/api/network-optimization', require('./routes/networkOptimization')); app.use('/api/last-mile-optimization', require('./routes/lastMileOptimization')); app.use('/api/blockchain-traceability', require('./routes/blockchainTraceability')); app.use('/api/supplier-collaboration-portal', require('./routes/supplierCollaborationPortal')); app.use('/api/iot-cold-chain', require('./routes/iotColdChain'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-network-optimization-facility-sourcing-point-placement', require('./routes/gapNoAiDrivenNetworkOptimizationFacilitySourcingPointPlacement'));
app.use('/api/gap-no-predictive-quality-scoring', require('./routes/gapNoPredictiveQualityScoring'));
app.use('/api/gap-no-ai-driven-freight-cost-optimization', require('./routes/gapNoAiDrivenFreightCostOptimization'));
app.use('/api/gap-no-iot-sensor-ingestion-temperature-humidity-for-cold', require('./routes/gapNoIotSensorIngestionTemperatureHumidityForCold'));
app.use('/api/gap-no-customer-portal-for-shipment-visibility', require('./routes/gapNoCustomerPortalForShipmentVisibility'));
app.use('/api/gap-no-3pl-integration', require('./routes/gapNo3plIntegration'));
app.use('/api/gap-no-freight-cost-analytics', require('./routes/gapNoFreightCostAnalytics'));
app.use('/api/gap-no-webhooks-or-external-notifications', require('./routes/gapNoWebhooksOrExternalNotifications'));
app.use('/api/gap-no-audit-log', require('./routes/gapNoAuditLog'));
app.use('/api/gap-no-multi-tenant-operator-separation', require('./routes/gapNoMultiTenantOperatorSeparation'));
