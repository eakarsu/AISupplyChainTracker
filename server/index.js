const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });

// Validate required env vars at startup
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID || !process.env.DATABASE_URL) throw new Error('JWT_SECRET (32+ characters), GOVERNANCE_TENANT_ID, and DATABASE_URL are required');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }
});

const PORT = process.env.PORT || process.env.BACKEND_PORT || process.env.SERVER_PORT || 3001;
const pool = require('./db');
const authMiddleware = require('./middleware/auth');

const generatedRoutesEnabled = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';

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
if (generatedRoutesEnabled) app.use('/api/ai', authMiddleware, require('./routes/ai'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));
app.use('/api/warehouses', authMiddleware, require('./routes/warehouses'));
app.use('/api/compliance', authMiddleware, require('./routes/compliance'));
app.use('/api/quality', authMiddleware, require('./routes/quality'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));
app.use('/api/fleet-agents', authMiddleware, require('./routes/fleetAgents'));
app.use('/api/detention-demurrage-exposure', authMiddleware, require('./routes/detentionDemurrageExposure'));
app.use('/api/governed-supply-chain', require('./governance'));
app.use('/api/governance', require('./governance'));

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
