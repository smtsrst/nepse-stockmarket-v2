#!/bin/bash

# NEPSE Dashboard Startup Script
# Run both backend (Python/FastAPI) and frontend (React/Vite) with one command

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting NEPSE Dashboard...${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend (Python/FastAPI)
echo -e "${GREEN}[1/2] Starting Backend (Python)...${NC}"
cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "  Using existing virtual environment"
elif [ -f "requirements.txt" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo "  Dependencies installed"
else
    echo -e "${RED}  Error: requirements.txt not found in backend/${NC}"
    exit 1
fi

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
echo "  Waiting for backend to initialize..."
sleep 4

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}  ⚠ Backend may still be starting (no /health endpoint)${NC}"
fi

# Start Frontend (React/Vite)
echo -e "${GREEN}[2/2] Starting Frontend (React)...${NC}"
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install
fi

# Start Vite dev server
npm run dev -- --host &
FRONTEND_PID=$!

# Wait for frontend to start
echo "  Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend running on http://localhost:5173${NC}"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend running on http://localhost:5174${NC}"
else
    echo -e "${YELLOW}  ⚠ Frontend may still be starting${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  NEPSE Dashboard is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Keep script running
wait
