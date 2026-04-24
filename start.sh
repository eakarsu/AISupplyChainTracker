#!/bin/bash

# ============================================
# AI Supply Chain Tracker - Start Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Supply Chain Tracker                  ║"
echo "║     Starting Application...                  ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}
DB_NAME=${DB_NAME:-supply_chain_tracker}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# ============================================
# Step 1: Clean up used ports
# ============================================
echo -e "\n${YELLOW}[1/6] Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${YELLOW}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  echo -e "  ${GREEN}✓ Port $port is free${NC}"
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT

# ============================================
# Step 2: Check PostgreSQL
# ============================================
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
  if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    else
      sudo systemctl start postgresql 2>/dev/null || true
    fi
    sleep 2
    echo -e "  ${GREEN}✓ PostgreSQL started${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ============================================
# Step 3: Create database if not exists
# ============================================
echo -e "\n${YELLOW}[3/6] Setting up database...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null || \
  echo -e "  ${YELLOW}⚠ Could not create database (may already exist)${NC}"

echo -e "  ${GREEN}✓ Database '$DB_NAME' ready${NC}"

# ============================================
# Step 4: Install dependencies
# ============================================
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing server dependencies...${NC}"
cd server && npm install --silent 2>&1 | tail -1 && cd ..
echo -e "  ${GREEN}✓ Server dependencies installed${NC}"

echo -e "  ${BLUE}Installing client dependencies...${NC}"
cd client && npm install --silent 2>&1 | tail -1 && cd ..
echo -e "  ${GREEN}✓ Client dependencies installed${NC}"

# ============================================
# Step 5: Seed database
# ============================================
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"

cd server && node seed.js && cd ..
echo -e "  ${GREEN}✓ Database seeded with sample data${NC}"

# ============================================
# Step 6: Start application with hot reload
# ============================================
echo -e "\n${YELLOW}[6/6] Starting application...${NC}"
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗"
echo -e "║  Server: http://localhost:$SERVER_PORT              ║"
echo -e "║  Client: http://localhost:$CLIENT_PORT              ║"
echo -e "║                                              ║"
echo -e "║  Login:  admin@supplychain.com / admin123    ║"
echo -e "║                                              ║"
echo -e "║  Press Ctrl+C to stop all services           ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""

# Trap to clean up on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $(jobs -p) 2>/dev/null || true
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Get the project root directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start server with nodemon for hot reload
echo -e "${PURPLE}Starting server with hot reload (nodemon)...${NC}"
(cd "$PROJECT_DIR/server" && npx nodemon index.js) &
SERVER_PID=$!

sleep 2

# Start client with React hot reload
echo -e "${PURPLE}Starting client with hot reload...${NC}"
(cd "$PROJECT_DIR/client" && PORT=$CLIENT_PORT BROWSER=none npm start) &
CLIENT_PID=$!

# Wait for both processes
wait
