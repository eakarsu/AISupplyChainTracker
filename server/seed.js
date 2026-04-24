const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'supply_chain_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  console.log('🌱 Starting database seed...');

  // Drop and recreate tables
  await pool.query(`
    DROP TABLE IF EXISTS quality_inspections CASCADE;
    DROP TABLE IF EXISTS compliance_records CASCADE;
    DROP TABLE IF EXISTS warehouses CASCADE;
    DROP TABLE IF EXISTS demand_forecasts CASCADE;
    DROP TABLE IF EXISTS shipping_routes CASCADE;
    DROP TABLE IF EXISTS risk_alerts CASCADE;
    DROP TABLE IF EXISTS inventory CASCADE;
    DROP TABLE IF EXISTS disruptions CASCADE;
    DROP TABLE IF EXISTS purchase_orders CASCADE;
    DROP TABLE IF EXISTS shipments CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  // Create tables
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(100),
      category VARCHAR(100),
      risk_score DECIMAL(3,1) DEFAULT 0,
      reliability_rating DECIMAL(3,1) DEFAULT 0,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      lead_time_days INTEGER,
      annual_revenue DECIMAL(15,2),
      compliance_status VARCHAR(50) DEFAULT 'compliant',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE shipments (
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
      priority VARCHAR(20) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE disruptions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      severity VARCHAR(20),
      region VARCHAR(100),
      description TEXT,
      impact_score DECIMAL(3,1),
      probability DECIMAL(5,2),
      affected_suppliers TEXT,
      estimated_duration_days INTEGER,
      mitigation_strategy TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE inventory (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(50) UNIQUE,
      product_name VARCHAR(255),
      category VARCHAR(100),
      quantity INTEGER DEFAULT 0,
      unit_price DECIMAL(10,2),
      warehouse_location VARCHAR(100),
      reorder_point INTEGER,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      last_restocked DATE,
      status VARCHAR(50) DEFAULT 'in_stock',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE risk_alerts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      alert_type VARCHAR(100),
      severity VARCHAR(20),
      source VARCHAR(100),
      description TEXT,
      affected_entity VARCHAR(255),
      risk_score DECIMAL(3,1),
      recommended_action TEXT,
      status VARCHAR(50) DEFAULT 'active',
      region VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE shipping_routes (
      id SERIAL PRIMARY KEY,
      route_name VARCHAR(255),
      origin VARCHAR(255),
      destination VARCHAR(255),
      transport_mode VARCHAR(50),
      distance_km DECIMAL(10,2),
      estimated_hours DECIMAL(8,2),
      cost_per_kg DECIMAL(8,2),
      carbon_emission_kg DECIMAL(8,2),
      reliability_score DECIMAL(3,1),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE demand_forecasts (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(255),
      category VARCHAR(100),
      current_demand INTEGER,
      predicted_demand INTEGER,
      confidence_score DECIMAL(5,2),
      forecast_period VARCHAR(50),
      region VARCHAR(100),
      trend VARCHAR(20),
      seasonal_factor DECIMAL(4,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE purchase_orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE,
      supplier_name VARCHAR(255),
      product VARCHAR(255),
      quantity INTEGER,
      unit_price DECIMAL(10,2),
      total_amount DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'pending',
      expected_delivery DATE,
      priority VARCHAR(20) DEFAULT 'medium',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE warehouses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(20) UNIQUE,
      location VARCHAR(255),
      country VARCHAR(100),
      capacity_sqft INTEGER,
      used_sqft INTEGER,
      warehouse_type VARCHAR(50),
      manager_name VARCHAR(255),
      manager_email VARCHAR(255),
      temperature_controlled BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE compliance_records (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      compliance_type VARCHAR(100),
      entity_name VARCHAR(255),
      standard VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      auditor VARCHAR(255),
      audit_date DATE,
      expiry_date DATE,
      risk_level VARCHAR(20),
      findings TEXT,
      corrective_action TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE quality_inspections (
      id SERIAL PRIMARY KEY,
      inspection_number VARCHAR(50) UNIQUE,
      product_name VARCHAR(255),
      supplier_name VARCHAR(255),
      batch_number VARCHAR(100),
      inspection_type VARCHAR(50),
      result VARCHAR(20) DEFAULT 'pending',
      defects_found INTEGER DEFAULT 0,
      defect_rate DECIMAL(5,2) DEFAULT 0,
      inspector VARCHAR(255),
      inspection_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Tables created');

  // Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  await pool.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
    ['Admin User', 'admin@supplychain.com', passwordHash, 'admin']);
  console.log('✅ Users seeded');

  // Seed Suppliers (16 items)
  const suppliers = [
    ['TechCore Manufacturing', 'China', 'Electronics', 7.2, 8.5, 'contact@techcore.cn', '+86-21-5555-0001', 14, 45000000, 'compliant'],
    ['GlobalSteel Corp', 'India', 'Raw Materials', 5.8, 7.2, 'sales@globalsteel.in', '+91-22-5555-0002', 21, 78000000, 'compliant'],
    ['EuroChemicals AG', 'Germany', 'Chemicals', 3.2, 9.1, 'info@eurochem.de', '+49-30-5555-0003', 10, 120000000, 'compliant'],
    ['Pacific Logistics', 'Japan', 'Logistics', 4.5, 8.8, 'ops@paclog.jp', '+81-3-5555-0004', 7, 35000000, 'compliant'],
    ['AmeriParts Inc', 'USA', 'Auto Parts', 2.1, 9.5, 'orders@ameriparts.com', '+1-312-555-0005', 5, 92000000, 'compliant'],
    ['BrazilAgro Ltd', 'Brazil', 'Agriculture', 6.7, 6.8, 'export@brazilagro.br', '+55-11-5555-0006', 30, 28000000, 'under_review'],
    ['VietTextile Co', 'Vietnam', 'Textiles', 5.4, 7.5, 'sales@viettextile.vn', '+84-28-5555-0007', 18, 15000000, 'compliant'],
    ['Nordic Pharma', 'Sweden', 'Pharmaceuticals', 2.8, 9.3, 'supply@nordicpharma.se', '+46-8-5555-0008', 12, 200000000, 'compliant'],
    ['MexicoFoods SA', 'Mexico', 'Food & Beverage', 4.9, 7.8, 'ventas@mexfoods.mx', '+52-55-5555-0009', 8, 42000000, 'compliant'],
    ['KoreaChip Ltd', 'South Korea', 'Semiconductors', 6.1, 8.2, 'biz@koreachip.kr', '+82-2-5555-0010', 16, 310000000, 'compliant'],
    ['AusMineral Group', 'Australia', 'Mining', 3.9, 8.7, 'trade@ausmineral.au', '+61-2-5555-0011', 25, 180000000, 'compliant'],
    ['TurkeyTextiles', 'Turkey', 'Textiles', 7.8, 6.2, 'export@turktex.tr', '+90-212-555-0012', 15, 22000000, 'non_compliant'],
    ['CanadaTimber Inc', 'Canada', 'Forestry', 2.5, 9.0, 'sales@cantimber.ca', '+1-604-555-0013', 10, 55000000, 'compliant'],
    ['UK Precision Tools', 'United Kingdom', 'Machinery', 3.4, 8.9, 'orders@uktools.co.uk', '+44-20-5555-0014', 8, 67000000, 'compliant'],
    ['SingaporeElec Pte', 'Singapore', 'Electronics', 4.2, 8.6, 'supply@sgelectronics.sg', '+65-5555-0015', 6, 88000000, 'compliant'],
    ['PolandChem Sp', 'Poland', 'Chemicals', 5.0, 7.6, 'office@polchem.pl', '+48-22-5555-0016', 12, 31000000, 'under_review'],
  ];
  for (const s of suppliers) {
    await pool.query(`INSERT INTO suppliers (name,country,category,risk_score,reliability_rating,contact_email,contact_phone,lead_time_days,annual_revenue,compliance_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, s);
  }
  console.log('✅ Suppliers seeded (16)');

  // Seed Shipments (16 items)
  const shipments = [
    ['SHP-2024-001', 'Shanghai, China', 'Los Angeles, USA', 'Maersk', 'in_transit', 4500, '2024-03-15', 'Pacific Ocean - Mid Route', 'sea_freight', 'high'],
    ['SHP-2024-002', 'Mumbai, India', 'Rotterdam, Netherlands', 'MSC', 'in_transit', 2800, '2024-03-12', 'Arabian Sea', 'sea_freight', 'medium'],
    ['SHP-2024-003', 'Tokyo, Japan', 'San Francisco, USA', 'FedEx', 'delivered', 120, '2024-03-01', 'San Francisco, USA', 'air_freight', 'critical'],
    ['SHP-2024-004', 'Berlin, Germany', 'New York, USA', 'DHL', 'in_transit', 350, '2024-03-10', 'London Heathrow', 'air_freight', 'high'],
    ['SHP-2024-005', 'São Paulo, Brazil', 'Hamburg, Germany', 'Hapag-Lloyd', 'pending', 8200, '2024-03-20', 'São Paulo Port', 'sea_freight', 'low'],
    ['SHP-2024-006', 'Seoul, South Korea', 'Chicago, USA', 'UPS', 'in_transit', 85, '2024-03-08', 'Anchorage, Alaska', 'air_freight', 'critical'],
    ['SHP-2024-007', 'Melbourne, Australia', 'Singapore', 'ONE', 'delivered', 3200, '2024-02-28', 'Singapore', 'sea_freight', 'medium'],
    ['SHP-2024-008', 'Istanbul, Turkey', 'Dubai, UAE', 'Turkish Cargo', 'delayed', 450, '2024-03-05', 'Istanbul Airport', 'air_freight', 'high'],
    ['SHP-2024-009', 'Vancouver, Canada', 'Yokohama, Japan', 'Evergreen', 'in_transit', 5600, '2024-03-18', 'North Pacific', 'sea_freight', 'medium'],
    ['SHP-2024-010', 'Ho Chi Minh, Vietnam', 'London, UK', 'CMA CGM', 'pending', 1800, '2024-03-22', 'Ho Chi Minh Port', 'sea_freight', 'low'],
    ['SHP-2024-011', 'Mexico City, Mexico', 'Dallas, USA', 'XPO Logistics', 'in_transit', 12000, '2024-03-07', 'Laredo, Texas', 'truck', 'high'],
    ['SHP-2024-012', 'Stockholm, Sweden', 'Warsaw, Poland', 'DB Schenker', 'delivered', 900, '2024-03-02', 'Warsaw, Poland', 'rail', 'medium'],
    ['SHP-2024-013', 'Guangzhou, China', 'Sydney, Australia', 'COSCO', 'in_transit', 7800, '2024-03-16', 'South China Sea', 'sea_freight', 'high'],
    ['SHP-2024-014', 'Singapore', 'Mumbai, India', 'PIL', 'delayed', 2100, '2024-03-09', 'Strait of Malacca', 'sea_freight', 'critical'],
    ['SHP-2024-015', 'Dubai, UAE', 'Nairobi, Kenya', 'Emirates SkyCargo', 'in_transit', 200, '2024-03-11', 'Dubai Airport', 'air_freight', 'medium'],
    ['SHP-2024-016', 'Amsterdam, Netherlands', 'Toronto, Canada', 'KLM Cargo', 'pending', 680, '2024-03-25', 'Amsterdam Schiphol', 'air_freight', 'low'],
  ];
  for (const s of shipments) {
    await pool.query(`INSERT INTO shipments (tracking_number,origin,destination,carrier,status,weight_kg,estimated_delivery,current_location,shipment_type,priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, s);
  }
  console.log('✅ Shipments seeded (16)');

  // Seed Disruptions (16 items)
  const disruptions = [
    ['Red Sea Shipping Disruption', 'geopolitical', 'critical', 'Middle East', 'Houthi attacks on commercial vessels forcing rerouting around Cape of Good Hope', 9.5, 85.5, 'Maersk, MSC, CMA CGM', 90, 'Reroute via Cape of Good Hope, increase buffer stock'],
    ['Taiwan Strait Tensions', 'geopolitical', 'high', 'East Asia', 'Increased military activity near Taiwan affecting semiconductor supply', 8.8, 45.0, 'KoreaChip, TechCore, SingaporeElec', 60, 'Diversify chip sourcing, build strategic reserves'],
    ['European Rail Strike', 'labor', 'medium', 'Europe', 'Railway workers strike across Germany and France affecting freight', 6.2, 70.0, 'EuroChemicals, UK Precision Tools', 14, 'Switch to truck freight temporarily'],
    ['Yangtze River Drought', 'natural_disaster', 'high', 'China', 'Low water levels affecting inland shipping and hydroelectric power', 7.8, 60.0, 'TechCore Manufacturing', 45, 'Alternative shipping routes and power backup'],
    ['US Port Congestion', 'infrastructure', 'medium', 'North America', 'Container backlog at LA/Long Beach ports', 5.5, 75.0, 'AmeriParts Inc', 30, 'Divert to alternative ports (Oakland, Seattle)'],
    ['Suez Canal Blockage Risk', 'infrastructure', 'high', 'Middle East', 'Increased traffic and risk of another blockage incident', 8.0, 30.0, 'GlobalSteel, EuroChemicals', 21, 'Maintain Cape route contingency plans'],
    ['Southeast Asia Monsoon', 'natural_disaster', 'medium', 'Southeast Asia', 'Annual monsoon season affecting production and logistics', 5.8, 90.0, 'VietTextile, Pacific Logistics', 60, 'Pre-stock inventory before monsoon season'],
    ['Brazil Port Workers Strike', 'labor', 'medium', 'South America', 'Potential strike at Santos port affecting agri exports', 6.0, 55.0, 'BrazilAgro Ltd', 21, 'Expedite current orders, find alternative ports'],
    ['Chip Shortage Wave 2', 'supply_shortage', 'critical', 'Global', 'New automotive chip shortage affecting multiple industries', 9.2, 65.0, 'KoreaChip, TechCore, SingaporeElec', 120, 'Long-term contracts, dual sourcing strategy'],
    ['Turkey Earthquake Risk', 'natural_disaster', 'high', 'Middle East', 'Seismic activity in manufacturing regions of Turkey', 7.5, 25.0, 'TurkeyTextiles', 90, 'Identify backup textile suppliers in India/Vietnam'],
    ['Australian Bushfire Season', 'natural_disaster', 'medium', 'Oceania', 'Wildfire risk threatening mining and logistics operations', 5.2, 40.0, 'AusMineral Group', 30, 'Stockpile critical minerals, alternative sources'],
    ['Cyber Attack on Shipping', 'cyber', 'critical', 'Global', 'Ransomware targeting shipping company IT systems', 9.0, 35.0, 'All carriers', 14, 'Backup communication channels, manual procedures'],
    ['Indian Ocean Piracy Surge', 'security', 'medium', 'Indian Ocean', 'Increased piracy incidents in shipping lanes', 6.5, 50.0, 'GlobalSteel, PIL', 45, 'Armed escorts, route adjustment'],
    ['EU Carbon Tax Impact', 'regulatory', 'medium', 'Europe', 'New carbon border adjustment mechanism affecting costs', 5.0, 95.0, 'EuroChemicals, PolandChem', 365, 'Carbon offset programs, green logistics'],
    ['Panama Canal Water Crisis', 'natural_disaster', 'high', 'Central America', 'Drought reducing canal capacity and transit slots', 7.2, 80.0, 'Multiple carriers', 60, 'Book transit slots early, consider Suez alternative'],
    ['Russian Sanctions Ripple', 'geopolitical', 'medium', 'Eastern Europe', 'Ongoing sanctions affecting raw material supply chains', 6.8, 85.0, 'PolandChem, EuroChemicals', 180, 'Source from non-sanctioned alternatives'],
  ];
  for (const d of disruptions) {
    await pool.query(`INSERT INTO disruptions (title,type,severity,region,description,impact_score,probability,affected_suppliers,estimated_duration_days,mitigation_strategy) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, d);
  }
  console.log('✅ Disruptions seeded (16)');

  // Seed Inventory (16 items)
  const inventoryItems = [
    ['SKU-EL-001', 'Microcontroller MCU-X1', 'Electronics', 15000, 4.50, 'Warehouse A - Shelf 12', 3000, 1, '2024-02-15', 'in_stock'],
    ['SKU-EL-002', 'LED Display Panel 10"', 'Electronics', 2500, 45.00, 'Warehouse A - Shelf 8', 500, 10, '2024-02-20', 'in_stock'],
    ['SKU-RM-001', 'Steel Coil Grade A', 'Raw Materials', 800, 120.00, 'Warehouse B - Bay 3', 200, 2, '2024-01-30', 'low_stock'],
    ['SKU-CH-001', 'Industrial Solvent IS-50', 'Chemicals', 5000, 8.75, 'Warehouse C - Tank 1', 1000, 3, '2024-02-10', 'in_stock'],
    ['SKU-AP-001', 'Brake Pad Assembly BP-200', 'Auto Parts', 12000, 15.30, 'Warehouse D - Rack 5', 2000, 5, '2024-02-25', 'in_stock'],
    ['SKU-TX-001', 'Cotton Fabric Roll 100m', 'Textiles', 350, 85.00, 'Warehouse E - Shelf 2', 100, 7, '2024-02-01', 'in_stock'],
    ['SKU-PH-001', 'Acetaminophen API Bulk', 'Pharmaceuticals', 45, 2500.00, 'Warehouse F - Cold Storage', 10, 8, '2024-01-15', 'low_stock'],
    ['SKU-FB-001', 'Organic Coffee Beans 50kg', 'Food & Beverage', 200, 180.00, 'Warehouse G - Climate Ctrl', 50, 9, '2024-02-18', 'in_stock'],
    ['SKU-SC-001', 'AI Processor Chip AP-7', 'Semiconductors', 500, 350.00, 'Warehouse A - Secure', 100, 10, '2024-02-05', 'in_stock'],
    ['SKU-MN-001', 'Lithium Ore Batch 1T', 'Mining', 25, 8500.00, 'Warehouse H - Outdoor', 5, 11, '2024-01-20', 'critical'],
    ['SKU-FR-001', 'Pine Lumber 2x4 Bundle', 'Forestry', 1500, 12.00, 'Warehouse I - Yard', 300, 13, '2024-02-12', 'in_stock'],
    ['SKU-MC-001', 'CNC Drill Bit Set', 'Machinery', 800, 65.00, 'Warehouse D - Tools', 150, 14, '2024-02-08', 'in_stock'],
    ['SKU-EL-003', 'Capacitor Pack 1000pcs', 'Electronics', 50000, 0.15, 'Warehouse A - Shelf 20', 10000, 15, '2024-02-22', 'in_stock'],
    ['SKU-CH-002', 'Epoxy Resin ER-100', 'Chemicals', 300, 55.00, 'Warehouse C - Bay 7', 75, 16, '2024-01-25', 'in_stock'],
    ['SKU-RM-002', 'Aluminum Sheet 2mm', 'Raw Materials', 120, 95.00, 'Warehouse B - Bay 8', 30, 2, '2024-02-14', 'low_stock'],
    ['SKU-TX-002', 'Polyester Thread 5000m', 'Textiles', 8000, 3.20, 'Warehouse E - Shelf 6', 1500, 12, '2024-02-19', 'in_stock'],
  ];
  for (const i of inventoryItems) {
    await pool.query(`INSERT INTO inventory (sku,product_name,category,quantity,unit_price,warehouse_location,reorder_point,supplier_id,last_restocked,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, i);
  }
  console.log('✅ Inventory seeded (16)');

  // Seed Risk Alerts (16 items)
  const alerts = [
    ['Critical: Red Sea Route Disruption', 'route_disruption', 'critical', 'Intelligence Report', 'Multiple carriers suspending Red Sea transit', 'Maersk Line', 9.5, 'Reroute all shipments via Cape of Good Hope immediately', 'active', 'Middle East'],
    ['Supplier Financial Distress: TurkeyTextiles', 'financial', 'high', 'Credit Agency', 'Credit rating downgraded, payment delays reported', 'TurkeyTextiles', 8.2, 'Reduce order volume, identify backup supplier', 'active', 'Turkey'],
    ['Port Congestion: Los Angeles', 'logistics', 'medium', 'Port Authority', 'Container dwell times exceeding 7 days', 'LA/Long Beach Port', 6.5, 'Divert to Oakland or use rail intermodal', 'active', 'North America'],
    ['Quality Issue: Batch Recall', 'quality', 'high', 'QA Department', 'Contamination detected in chemical shipment', 'EuroChemicals AG', 7.8, 'Quarantine affected inventory, request replacement', 'active', 'Europe'],
    ['Regulatory Change: EU CBAM', 'regulatory', 'medium', 'Legal Team', 'New carbon border adjustment affecting import costs', 'EU Suppliers', 5.5, 'Calculate carbon footprint for all EU imports', 'acknowledged', 'Europe'],
    ['Weather Alert: Typhoon Warning', 'weather', 'high', 'Met Office', 'Category 4 typhoon approaching South China Sea', 'Pacific Routes', 8.0, 'Delay shipments, secure warehouse inventory', 'active', 'East Asia'],
    ['Cyber Threat: Shipping Systems', 'cyber', 'critical', 'Security Team', 'Targeted ransomware campaign against logistics firms', 'All Carriers', 9.0, 'Enable backup systems, verify all communications', 'active', 'Global'],
    ['Supplier Capacity Alert', 'capacity', 'medium', 'Procurement', 'TechCore at 95% capacity, lead times increasing', 'TechCore Manufacturing', 6.8, 'Place advance orders, explore alternative suppliers', 'active', 'China'],
    ['Currency Volatility: BRL', 'financial', 'medium', 'Finance Team', 'Brazilian Real depreciation affecting contract pricing', 'BrazilAgro Ltd', 5.8, 'Hedge currency exposure, renegotiate contracts', 'acknowledged', 'South America'],
    ['Sanctions Update: Russia', 'compliance', 'high', 'Compliance Team', 'New sanctions affecting raw material sourcing', 'Eastern Europe Suppliers', 7.5, 'Audit supply chain for sanction exposure', 'active', 'Eastern Europe'],
    ['Inventory Critical: Lithium Ore', 'inventory', 'critical', 'Warehouse System', 'Stock below minimum threshold, 5 units remaining', 'AusMineral Group', 9.2, 'Emergency order required, contact alternative suppliers', 'active', 'Australia'],
    ['Demand Spike: AI Processors', 'demand', 'high', 'Sales Team', 'Unexpected 40% increase in AI chip orders', 'KoreaChip Ltd', 7.2, 'Accelerate production orders, manage allocation', 'active', 'South Korea'],
    ['Labor Dispute: German Rail', 'labor', 'medium', 'News Monitor', 'Train drivers union announcing 3-day strike', 'DB Schenker', 6.0, 'Switch to truck transport for affected routes', 'acknowledged', 'Europe'],
    ['Environmental: River Pollution', 'environmental', 'medium', 'Environmental Agency', 'Industrial discharge affecting waterway near supplier', 'GlobalSteel Corp', 5.5, 'Monitor situation, prepare alternative logistics', 'active', 'India'],
    ['Geopolitical: Trade Tariff Increase', 'geopolitical', 'high', 'Trade Office', 'New 25% tariff on electronics from certain regions', 'TechCore, SingaporeElec', 8.5, 'Evaluate total cost impact, consider nearshoring', 'active', 'East Asia'],
    ['Transportation: Fuel Price Surge', 'cost', 'medium', 'Market Data', 'Diesel prices up 30% affecting trucking costs', 'All Transport', 6.2, 'Review transport contracts, optimize route efficiency', 'active', 'Global'],
  ];
  for (const a of alerts) {
    await pool.query(`INSERT INTO risk_alerts (title,alert_type,severity,source,description,affected_entity,risk_score,recommended_action,status,region) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, a);
  }
  console.log('✅ Risk Alerts seeded (16)');

  // Seed Shipping Routes (16 items)
  const routes = [
    ['Shanghai-LA Pacific Express', 'Shanghai, China', 'Los Angeles, USA', 'sea', 10500, 336, 0.85, 2800, 7.5, 'active'],
    ['Mumbai-Rotterdam Direct', 'Mumbai, India', 'Rotterdam, Netherlands', 'sea', 11200, 384, 0.92, 3100, 7.2, 'active'],
    ['Tokyo-SFO Air Priority', 'Tokyo, Japan', 'San Francisco, USA', 'air', 8300, 11, 12.50, 850, 9.2, 'active'],
    ['Berlin-NYC Express Air', 'Berlin, Germany', 'New York, USA', 'air', 6400, 9, 10.80, 720, 9.5, 'active'],
    ['Sao Paulo-Hamburg Ocean', 'São Paulo, Brazil', 'Hamburg, Germany', 'sea', 9800, 456, 0.78, 2600, 6.8, 'active'],
    ['Seoul-Chicago Air Cargo', 'Seoul, South Korea', 'Chicago, USA', 'air', 10200, 14, 11.20, 920, 8.8, 'active'],
    ['Melbourne-Singapore Sea', 'Melbourne, Australia', 'Singapore', 'sea', 6200, 168, 0.65, 1600, 8.5, 'active'],
    ['Istanbul-Dubai Express', 'Istanbul, Turkey', 'Dubai, UAE', 'air', 3000, 4, 8.50, 380, 8.0, 'active'],
    ['Vancouver-Yokohama Trans-Pacific', 'Vancouver, Canada', 'Yokohama, Japan', 'sea', 7600, 264, 0.72, 2000, 7.8, 'active'],
    ['HCMC-London Multi-Modal', 'Ho Chi Minh, Vietnam', 'London, UK', 'sea', 14500, 720, 0.55, 3800, 6.5, 'active'],
    ['Mexico City-Dallas Truck', 'Mexico City, Mexico', 'Dallas, USA', 'truck', 1800, 28, 2.10, 450, 8.2, 'active'],
    ['Stockholm-Warsaw Rail', 'Stockholm, Sweden', 'Warsaw, Poland', 'rail', 1200, 18, 1.85, 180, 9.0, 'active'],
    ['Guangzhou-Sydney Ocean', 'Guangzhou, China', 'Sydney, Australia', 'sea', 7800, 312, 0.70, 2100, 7.0, 'active'],
    ['Singapore-Mumbai Coastal', 'Singapore', 'Mumbai, India', 'sea', 4500, 144, 0.60, 1200, 7.8, 'active'],
    ['Dubai-Nairobi Air Cargo', 'Dubai, UAE', 'Nairobi, Kenya', 'air', 3800, 5, 9.20, 480, 8.5, 'active'],
    ['Amsterdam-Toronto Atlantic', 'Amsterdam, Netherlands', 'Toronto, Canada', 'air', 5900, 8, 10.50, 650, 9.3, 'active'],
  ];
  for (const r of routes) {
    await pool.query(`INSERT INTO shipping_routes (route_name,origin,destination,transport_mode,distance_km,estimated_hours,cost_per_kg,carbon_emission_kg,reliability_score,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, r);
  }
  console.log('✅ Shipping Routes seeded (16)');

  // Seed Demand Forecasts (16 items)
  const forecasts = [
    ['Microcontroller MCU-X1', 'Electronics', 15000, 18500, 87.5, 'Q2 2024', 'North America', 'growing', 1.15, 'Strong demand from IoT sector'],
    ['LED Display Panel 10"', 'Electronics', 2500, 3200, 82.0, 'Q2 2024', 'Europe', 'growing', 1.20, 'New product launches driving demand'],
    ['Steel Coil Grade A', 'Raw Materials', 800, 650, 78.5, 'Q2 2024', 'Global', 'declining', 0.85, 'Construction slowdown in key markets'],
    ['Industrial Solvent IS-50', 'Chemicals', 5000, 5100, 92.0, 'Q2 2024', 'North America', 'stable', 1.02, 'Steady industrial demand'],
    ['Brake Pad Assembly BP-200', 'Auto Parts', 12000, 14000, 85.0, 'Q2 2024', 'North America', 'growing', 1.10, 'EV transition creating new demand'],
    ['Cotton Fabric Roll 100m', 'Textiles', 350, 280, 75.0, 'Q2 2024', 'Asia', 'declining', 0.80, 'Shift to synthetic materials'],
    ['Acetaminophen API Bulk', 'Pharmaceuticals', 45, 60, 90.0, 'Q2 2024', 'Global', 'growing', 1.30, 'Flu season and stockpiling'],
    ['Organic Coffee Beans 50kg', 'Food & Beverage', 200, 250, 80.0, 'Q2 2024', 'Europe', 'growing', 1.25, 'Growing organic market trend'],
    ['AI Processor Chip AP-7', 'Semiconductors', 500, 850, 88.0, 'Q2 2024', 'Global', 'growing', 1.65, 'AI boom driving unprecedented demand'],
    ['Lithium Ore Batch 1T', 'Mining', 25, 40, 82.0, 'Q2 2024', 'Global', 'growing', 1.50, 'EV battery demand surge'],
    ['Pine Lumber 2x4 Bundle', 'Forestry', 1500, 1400, 85.0, 'Q2 2024', 'North America', 'declining', 0.95, 'Housing market correction'],
    ['CNC Drill Bit Set', 'Machinery', 800, 820, 91.0, 'Q2 2024', 'Europe', 'stable', 1.02, 'Steady manufacturing demand'],
    ['Capacitor Pack 1000pcs', 'Electronics', 50000, 58000, 86.0, 'Q2 2024', 'Asia', 'growing', 1.15, 'Consumer electronics growth'],
    ['Epoxy Resin ER-100', 'Chemicals', 300, 350, 83.0, 'Q2 2024', 'North America', 'growing', 1.12, 'Aerospace and composite demand'],
    ['Aluminum Sheet 2mm', 'Raw Materials', 120, 100, 79.0, 'Q2 2024', 'Europe', 'declining', 0.88, 'European manufacturing slowdown'],
    ['Polyester Thread 5000m', 'Textiles', 8000, 8500, 88.0, 'Q2 2024', 'Asia', 'growing', 1.08, 'Fast fashion demand continues'],
  ];
  for (const f of forecasts) {
    await pool.query(`INSERT INTO demand_forecasts (product_name,category,current_demand,predicted_demand,confidence_score,forecast_period,region,trend,seasonal_factor,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, f);
  }
  console.log('✅ Demand Forecasts seeded (16)');

  // Seed Purchase Orders (16 items)
  const orders = [
    ['PO-2024-001', 'TechCore Manufacturing', 'Microcontroller MCU-X1', 5000, 4.50, 22500.00, 'approved', '2024-03-20', 'high', 'Urgent restock for Q2 production'],
    ['PO-2024-002', 'GlobalSteel Corp', 'Steel Coil Grade A', 200, 120.00, 24000.00, 'pending', '2024-04-01', 'medium', 'Regular quarterly order'],
    ['PO-2024-003', 'EuroChemicals AG', 'Industrial Solvent IS-50', 2000, 8.75, 17500.00, 'shipped', '2024-03-10', 'medium', 'Standard replenishment'],
    ['PO-2024-004', 'KoreaChip Ltd', 'AI Processor Chip AP-7', 200, 350.00, 70000.00, 'approved', '2024-03-25', 'critical', 'Emergency order - AI demand spike'],
    ['PO-2024-005', 'AmeriParts Inc', 'Brake Pad Assembly BP-200', 3000, 15.30, 45900.00, 'delivered', '2024-02-28', 'medium', 'Q1 delivery completed'],
    ['PO-2024-006', 'VietTextile Co', 'Cotton Fabric Roll 100m', 150, 85.00, 12750.00, 'pending', '2024-04-10', 'low', 'Pre-season stocking'],
    ['PO-2024-007', 'Nordic Pharma', 'Acetaminophen API Bulk', 30, 2500.00, 75000.00, 'approved', '2024-03-15', 'high', 'Flu season preparation'],
    ['PO-2024-008', 'AusMineral Group', 'Lithium Ore Batch 1T', 15, 8500.00, 127500.00, 'pending', '2024-04-15', 'critical', 'Strategic stockpile'],
    ['PO-2024-009', 'CanadaTimber Inc', 'Pine Lumber 2x4 Bundle', 500, 12.00, 6000.00, 'shipped', '2024-03-08', 'low', 'Warehouse construction project'],
    ['PO-2024-010', 'UK Precision Tools', 'CNC Drill Bit Set', 200, 65.00, 13000.00, 'approved', '2024-03-18', 'medium', 'Tool replacement cycle'],
    ['PO-2024-011', 'SingaporeElec Pte', 'LED Display Panel 10"', 1000, 45.00, 45000.00, 'pending', '2024-04-05', 'high', 'New product line launch'],
    ['PO-2024-012', 'PolandChem Sp', 'Epoxy Resin ER-100', 100, 55.00, 5500.00, 'approved', '2024-03-22', 'medium', 'Aerospace contract fulfillment'],
    ['PO-2024-013', 'MexicoFoods SA', 'Organic Coffee Beans 50kg', 80, 180.00, 14400.00, 'shipped', '2024-03-05', 'medium', 'Café chain supply agreement'],
    ['PO-2024-014', 'BrazilAgro Ltd', 'Soybean Extract 25kg', 500, 42.00, 21000.00, 'delayed', '2024-03-12', 'high', 'Port strike causing delays'],
    ['PO-2024-015', 'TurkeyTextiles', 'Polyester Thread 5000m', 3000, 3.20, 9600.00, 'cancelled', '2024-03-30', 'low', 'Cancelled due to quality concerns'],
    ['PO-2024-016', 'Pacific Logistics', 'Logistics Service Package', 1, 15000.00, 15000.00, 'approved', '2024-03-15', 'high', 'Q2 logistics contract'],
  ];
  for (const o of orders) {
    await pool.query(`INSERT INTO purchase_orders (order_number,supplier_name,product,quantity,unit_price,total_amount,status,expected_delivery,priority,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, o);
  }
  console.log('✅ Purchase Orders seeded (16)');

  // Seed Warehouses (16 items)
  const warehouseData = [
    ['Central Distribution Hub', 'WH-001', 'Los Angeles, CA', 'USA', 250000, 187500, 'distribution', 'John Martinez', 'jmartinez@warehouse.com', false, 'active'],
    ['Northeast Fulfillment Center', 'WH-002', 'Newark, NJ', 'USA', 180000, 153000, 'fulfillment', 'Sarah Chen', 'schen@warehouse.com', false, 'active'],
    ['European Gateway Warehouse', 'WH-003', 'Rotterdam', 'Netherlands', 320000, 224000, 'distribution', 'Hans Weber', 'hweber@warehouse.eu', true, 'active'],
    ['Shanghai Import Terminal', 'WH-004', 'Shanghai', 'China', 400000, 360000, 'import_terminal', 'Wei Zhang', 'wzhang@warehouse.cn', true, 'active'],
    ['Tokyo Tech Storage', 'WH-005', 'Tokyo', 'Japan', 120000, 84000, 'storage', 'Yuki Tanaka', 'ytanaka@warehouse.jp', true, 'active'],
    ['Mumbai Regional Hub', 'WH-006', 'Mumbai', 'India', 200000, 170000, 'regional_hub', 'Priya Sharma', 'psharma@warehouse.in', false, 'active'],
    ['Cold Chain Facility Berlin', 'WH-007', 'Berlin', 'Germany', 80000, 64000, 'cold_storage', 'Klaus Mueller', 'kmueller@warehouse.de', true, 'active'],
    ['São Paulo South Hub', 'WH-008', 'São Paulo', 'Brazil', 150000, 97500, 'distribution', 'Carlos Santos', 'csantos@warehouse.br', false, 'active'],
    ['Singapore Free Trade Zone', 'WH-009', 'Singapore', 'Singapore', 175000, 148750, 'free_trade_zone', 'Li Wei', 'lwei@warehouse.sg', true, 'active'],
    ['Sydney Cross-Dock', 'WH-010', 'Sydney', 'Australia', 90000, 58500, 'cross_dock', 'James Cook', 'jcook@warehouse.au', false, 'active'],
    ['Dubai Logistics Park', 'WH-011', 'Dubai', 'UAE', 280000, 252000, 'logistics_park', 'Ahmed Al-Rashid', 'arashid@warehouse.ae', true, 'active'],
    ['Toronto E-Commerce Center', 'WH-012', 'Toronto', 'Canada', 130000, 110500, 'ecommerce', 'Emily Watson', 'ewatson@warehouse.ca', false, 'active'],
    ['Mexico City Consolidation', 'WH-013', 'Mexico City', 'Mexico', 100000, 65000, 'consolidation', 'Maria Lopez', 'mlopez@warehouse.mx', false, 'active'],
    ['Seoul Smart Warehouse', 'WH-014', 'Seoul', 'South Korea', 160000, 136000, 'automated', 'Park Ji-hoon', 'pjihoon@warehouse.kr', true, 'active'],
    ['London Returns Center', 'WH-015', 'London', 'United Kingdom', 70000, 42000, 'returns', 'Oliver Brown', 'obrown@warehouse.uk', false, 'active'],
    ['Inactive Warsaw Depot', 'WH-016', 'Warsaw', 'Poland', 95000, 0, 'storage', 'Jan Kowalski', 'jkowalski@warehouse.pl', false, 'inactive'],
  ];
  for (const w of warehouseData) {
    await pool.query(`INSERT INTO warehouses (name,code,location,country,capacity_sqft,used_sqft,warehouse_type,manager_name,manager_email,temperature_controlled,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, w);
  }
  console.log('✅ Warehouses seeded (16)');

  // Seed Compliance Records (16 items)
  const complianceData = [
    ['ISO 9001 Quality Management', 'certification', 'TechCore Manufacturing', 'ISO 9001:2015', 'passed', 'Bureau Veritas', '2024-01-15', '2027-01-15', 'low', 'Full compliance with all clauses', null],
    ['REACH Chemical Compliance', 'regulatory', 'EuroChemicals AG', 'EU REACH', 'passed', 'TÜV Rheinland', '2024-02-01', '2025-02-01', 'medium', 'Minor documentation gaps identified', 'Update SDS sheets by March 2024'],
    ['FDA Import Certification', 'certification', 'Nordic Pharma', 'FDA 21 CFR', 'passed', 'SGS SA', '2023-12-10', '2024-12-10', 'low', 'All pharmaceutical imports compliant', null],
    ['C-TPAT Security Audit', 'audit', 'Central Distribution Hub', 'C-TPAT', 'passed', 'US CBP', '2024-01-20', '2025-01-20', 'low', 'Tier 3 status maintained', null],
    ['Environmental Impact Assessment', 'environmental', 'GlobalSteel Corp', 'ISO 14001', 'conditional', 'DNV GL', '2024-02-15', '2025-02-15', 'high', 'Emissions exceed limits in Q4', 'Install new scrubber systems by Q2'],
    ['Labor Standards Compliance', 'social', 'VietTextile Co', 'SA8000', 'failed', 'Intertek', '2024-01-25', '2024-07-25', 'critical', 'Overtime violations and safety issues', 'Immediate corrective action plan required'],
    ['Customs Trade Compliance', 'regulatory', 'Pacific Logistics', 'AEO', 'passed', 'Japan Customs', '2023-11-30', '2026-11-30', 'low', 'Authorized Economic Operator renewed', null],
    ['Food Safety Certification', 'certification', 'MexicoFoods SA', 'FSSC 22000', 'passed', 'LRQA', '2024-02-10', '2025-08-10', 'low', 'All food handling procedures compliant', null],
    ['Conflict Minerals Report', 'regulatory', 'KoreaChip Ltd', 'Dodd-Frank Sec 1502', 'conditional', 'EY', '2024-01-05', '2025-01-05', 'medium', 'Partial traceability gaps in tantalum supply', 'Implement full supply chain mapping'],
    ['GDPR Data Compliance', 'data_privacy', 'SingaporeElec Pte', 'GDPR', 'passed', 'Internal Audit', '2024-02-20', '2025-02-20', 'low', 'All data handling procedures compliant', null],
    ['Hazardous Materials Handling', 'safety', 'PolandChem Sp', 'GHS/CLP', 'conditional', 'Bureau Veritas', '2024-01-10', '2025-01-10', 'high', 'Labeling inconsistencies found', 'Relabel all chemical containers'],
    ['Anti-Bribery Compliance', 'ethics', 'BrazilAgro Ltd', 'FCPA/UK Bribery Act', 'pending', 'Deloitte', '2024-03-01', '2025-03-01', 'medium', 'Audit scheduled', null],
    ['Export Control Screening', 'regulatory', 'UK Precision Tools', 'EAR/ITAR', 'passed', 'PwC', '2024-02-05', '2025-02-05', 'low', 'All exports properly classified', null],
    ['Warehouse Safety Inspection', 'safety', 'Dubai Logistics Park', 'OSHA/Local', 'passed', 'Dubai Municipality', '2024-01-30', '2025-01-30', 'low', 'All safety standards met', null],
    ['Supplier Code of Conduct', 'social', 'TurkeyTextiles', 'Company Standard', 'failed', 'Internal Audit', '2024-02-12', '2024-08-12', 'critical', 'Multiple violations of labor standards', 'Supplier remediation plan with 6-month deadline'],
    ['Carbon Footprint Audit', 'environmental', 'AusMineral Group', 'GHG Protocol', 'conditional', 'KPMG', '2024-01-18', '2025-01-18', 'medium', 'Scope 3 emissions not fully reported', 'Implement Scope 3 tracking by Q3'],
  ];
  for (const c of complianceData) {
    await pool.query(`INSERT INTO compliance_records (title,compliance_type,entity_name,standard,status,auditor,audit_date,expiry_date,risk_level,findings,corrective_action) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, c);
  }
  console.log('✅ Compliance Records seeded (16)');

  // Seed Quality Inspections (16 items)
  const qualityData = [
    ['QI-2024-001', 'Microcontroller MCU-X1', 'TechCore Manufacturing', 'BATCH-TC-2024-015', 'incoming', 'pass', 2, 0.04, 'David Kim', '2024-02-20', 'Minor cosmetic defects on 2 units, within tolerance'],
    ['QI-2024-002', 'Steel Coil Grade A', 'GlobalSteel Corp', 'BATCH-GS-2024-008', 'incoming', 'pass', 0, 0.00, 'Raj Patel', '2024-02-18', 'Full compliance with tensile strength specs'],
    ['QI-2024-003', 'Industrial Solvent IS-50', 'EuroChemicals AG', 'BATCH-EC-2024-022', 'incoming', 'fail', 15, 3.20, 'Anna Muller', '2024-02-15', 'Contamination detected - batch rejected'],
    ['QI-2024-004', 'AI Processor Chip AP-7', 'KoreaChip Ltd', 'BATCH-KC-2024-045', 'incoming', 'pass', 1, 0.20, 'Min-jun Lee', '2024-02-22', 'One unit failed burn-in test, rest OK'],
    ['QI-2024-005', 'Cotton Fabric Roll 100m', 'VietTextile Co', 'BATCH-VT-2024-033', 'incoming', 'conditional', 8, 2.30, 'Tran Minh', '2024-02-19', 'Color consistency issues in 8 rolls'],
    ['QI-2024-006', 'Brake Pad Assembly BP-200', 'AmeriParts Inc', 'BATCH-AP-2024-067', 'in_process', 'pass', 0, 0.00, 'Mike Johnson', '2024-02-21', 'Exceeds friction coefficient requirements'],
    ['QI-2024-007', 'Acetaminophen API Bulk', 'Nordic Pharma', 'BATCH-NP-2024-012', 'incoming', 'pass', 0, 0.00, 'Erik Svensson', '2024-02-17', 'All purity tests passed - 99.8% pure'],
    ['QI-2024-008', 'LED Display Panel 10"', 'SingaporeElec Pte', 'BATCH-SE-2024-029', 'final', 'pass', 3, 0.30, 'James Tan', '2024-02-23', 'Minor pixel defects within acceptance criteria'],
    ['QI-2024-009', 'Epoxy Resin ER-100', 'PolandChem Sp', 'BATCH-PC-2024-018', 'incoming', 'fail', 12, 4.00, 'Marta Nowak', '2024-02-14', 'Viscosity out of spec - batch returned'],
    ['QI-2024-010', 'CNC Drill Bit Set', 'UK Precision Tools', 'BATCH-UK-2024-041', 'incoming', 'pass', 1, 0.13, 'Oliver Smith', '2024-02-20', 'One bit slightly undersized, replaced'],
    ['QI-2024-011', 'Organic Coffee Beans 50kg', 'MexicoFoods SA', 'BATCH-MF-2024-055', 'incoming', 'pass', 0, 0.00, 'Carlos Rivera', '2024-02-16', 'Meets organic certification standards'],
    ['QI-2024-012', 'Lithium Ore Batch 1T', 'AusMineral Group', 'BATCH-AM-2024-007', 'incoming', 'conditional', 0, 0.00, 'Sarah Williams', '2024-02-13', 'Lithium content 2.8% vs 3.0% target'],
    ['QI-2024-013', 'Polyester Thread 5000m', 'TurkeyTextiles', 'BATCH-TT-2024-061', 'incoming', 'fail', 25, 5.00, 'Mehmet Yilmaz', '2024-02-19', 'Tensile strength below spec, color bleeding'],
    ['QI-2024-014', 'Pine Lumber 2x4 Bundle', 'CanadaTimber Inc', 'BATCH-CT-2024-034', 'incoming', 'pass', 2, 0.40, 'Pierre Dubois', '2024-02-21', 'Minor warping on 2 boards, acceptable'],
    ['QI-2024-015', 'Aluminum Sheet 2mm', 'GlobalSteel Corp', 'BATCH-GS-2024-019', 'incoming', 'pass', 0, 0.00, 'Raj Patel', '2024-02-22', 'Perfect thickness uniformity confirmed'],
    ['QI-2024-016', 'Capacitor Pack 1000pcs', 'TechCore Manufacturing', 'BATCH-TC-2024-088', 'final', 'pass', 5, 0.01, 'David Kim', '2024-02-23', 'Acceptable defect rate, all within ESR spec'],
  ];
  for (const q of qualityData) {
    await pool.query(`INSERT INTO quality_inspections (inspection_number,product_name,supplier_name,batch_number,inspection_type,result,defects_found,defect_rate,inspector,inspection_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, q);
  }
  console.log('✅ Quality Inspections seeded (16)');

  console.log('\n🎉 Database seeded successfully!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
