#!/bin/bash

# NEPSE Dashboard Startup Script
# Run both backend and frontend with one command

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

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

# Start Backend
echo -e "${GREEN}[1/2] Starting Backend...${NC}"
cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo -e "${RED}Virtual environment not found. Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend running on http://localhost:8000${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    exit 1
fi

# Start Frontend
echo -e "${GREEN}[2/2] Starting Frontend...${NC}"
cd "$FRONTEND_DIR"
npm run dev -- --host &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1 || curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend running on http://localhost:5173${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may be on different port, checking...${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  NEPSE Dashboard is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running
wait