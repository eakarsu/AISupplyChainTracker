const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/disruptions', require('./routes/disruptions'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/routes', require('./routes/routeOptimization'));
app.use('/api/demand', require('./routes/demand'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/quality', require('./routes/quality'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/fleet-agents', require('./routes/fleetAgents'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
