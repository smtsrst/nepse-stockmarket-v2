#!/bin/bash

# Local Development Script for NEPSE Dashboard
# Uses vercel dev to run both frontend and API locally

echo "========================================"
echo "NEPSE Dashboard - Local Development"
echo "========================================"
echo ""
echo "Starting Vercel development server..."
echo "Frontend: http://localhost:5173"
echo "API: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"

cd /Users/thisdevice/Documents/nepse-stockmarket-v2/frontend
vercel dev
