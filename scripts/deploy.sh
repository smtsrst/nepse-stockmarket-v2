#!/bin/bash
# NEPSE Dashboard - Deployment Script

echo "=== NEPSE Stock Dashboard Deployment ==="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Error: Git not initialized"
    echo "Run: git init"
    exit 1
fi

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1)
if [ "$python_version" != "3" ]; then
    echo "Warning: Python 3 not detected"
fi

echo "Prerequisites:"
echo "  - GitHub account"
echo "  - Vercel account" 
echo "  - Render account"
echo ""
echo "Deployment Steps:"
echo ""
echo "1. PUSH TO GITHUB"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. DEPLOY BACKEND (Render)"
echo "   - Go to https://render.com"
echo "   - Create Web Service"
echo "   - Connect GitHub repo"
echo "   - Build: pip install -r requirements.txt"
echo "   - Start: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "   - Add env vars: DATABASE_URL, SECRET_KEY, CORS_ORIGINS"
echo ""
echo "3. DEPLOY FRONTEND (Vercel)"
echo "   - Go to https://vercel.com"
echo "   - Import GitHub repo"
echo "   - Build: npm run build"
echo "   - Output: dist"
echo "   - Add env: VITE_API_URL=https://your-render-app.onrender.com/api"
echo ""
echo "4. VERIFY"
echo "   - Backend: https://your-app.onrender.com/health"
echo "   - Frontend: https://your-app.vercel.app"
echo ""
echo "=== Ready to Deploy ==="