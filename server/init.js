const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  if (process.env.ALLOW_SCHEMA_MIGRATION !== '1' || !process.env.DATABASE_URL) throw new Error('ALLOW_SCHEMA_MIGRATION=1 and DATABASE_URL are required');
  console.log('Running non-destructive schema init...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(100),
      category VARCHAR(100),
      risk_score DECIMAL(3,1) DEFAULT 0,
      reliability_rating DECIMAL(3,1) DEFAULT 0,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      address TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      tracking_number VARCHAR(100) UNIQUE,
      origin VARCHAR(255),
      destination VARCHAR(255),
      carrier VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      weight_kg DECIMAL(10,2),
      estimated_delivery DATE,
      current_location VARCHAR(255),
      shipment_type VARCHAR(50),
      priority VARCHAR(50) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'pending',
      total_amount DECIMAL(15,2),
      order_date DATE,
      expected_delivery DATE,
      items JSONB,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      category VARCHAR(100),
      quantity INTEGER DEFAULT 0,
      unit VARCHAR(50),
      reorder_point INTEGER DEFAULT 0,
      unit_cost DECIMAL(10,2),
      warehouse_location VARCHAR(100),
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      last_updated TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS disruptions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      severity VARCHAR(50),
      region VARCHAR(100),
      description TEXT,
      impact_score DECIMAL(3,1),
      probability DECIMAL(3,1),
      affected_suppliers TEXT,
      estimated_duration_days INTEGER,
      mitigation_strategy TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id SERIAL PRIMARY KEY,
      alert_type VARCHAR(100),
      severity VARCHAR(50),
      affected_entity TEXT,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shipping_routes (
      id SERIAL PRIMARY KEY,
      route_name VARCHAR(255),
      origin VARCHAR(255),
      destination VARCHAR(255),
      carrier VARCHAR(100),
      transit_days INTEGER,
      cost_per_kg DECIMAL(10,2),
      reliability_pct DECIMAL(5,2),
      mode VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS demand_forecasts (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(255),
      sku VARCHAR(100),
      forecast_date DATE,
      predicted_demand INTEGER,
      confidence_level DECIMAL(5,2),
      actual_demand INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      capacity_sqft INTEGER,
      current_utilization_pct DECIMAL(5,2),
      manager_name VARCHAR(255),
      contact_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS compliance_records (
      id SERIAL PRIMARY KEY,
      entity_name VARCHAR(255),
      entity_type VARCHAR(100),
      regulation_type VARCHAR(100),
      compliance_status VARCHAR(50),
      audit_date DATE,
      next_audit_date DATE,
      findings TEXT,
      corrective_actions TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quality_inspections (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      product_name VARCHAR(255),
      inspection_date DATE,
      inspector_name VARCHAR(255),
      result VARCHAR(50),
      defect_rate DECIMAL(5,2),
      score DECIMAL(5,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      input_data JSONB,
      result JSONB,
      tokens_used INTEGER,
      latency_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('Schema init complete (non-destructive).');
  pool.end();
}

init().catch(err => { console.error('Init error:', err.message); process.exit(1); });
