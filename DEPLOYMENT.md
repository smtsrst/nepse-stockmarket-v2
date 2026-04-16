# NEPSE Stock Dashboard - Deployment Guide

## Quick Deploy

### Option 1: Vercel + Render (Recommended)

#### Backend (Render)

1. **Create Render Account**
   - Go to https://render.com
   - Connect your GitHub account

2. **Deploy Backend**
   - Create New → Web Service
   - Connect GitHub repo
   - Settings:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
     - Python Version: 3.11

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   SECRET_KEY=your-secure-random-key
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   MOCK_MODE=false
   ```

#### Frontend (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Import your GitHub repository

2. **Deploy Frontend**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-render-app.onrender.com/api
   ```

---

### Option 2: Docker (Alternative)

Create `Dockerfile` in root:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend
RUN apt-get update && apt-get install -y nodejs npm

# Copy backend
COPY backend/ /app/backend
WORKDIR /app/backend
RUN pip install -r requirements.txt

# Copy frontend
COPY frontend/ /app/frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Expose ports
EXPOSE 8000 3000
```

---

## Pre-Deployment Checklist

- [ ] Generate SECRET_KEY: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Update CORS_ORIGINS with your domain
- [ ] Set MOCK_MODE=false for production
- [ ] Test locally first

## Testing Production Build

```bash
# Backend
cd backend
uvicorn app.main:app --port 8000

# Frontend  
cd frontend
npm run build
npm run preview
```

## Post-Deployment

- Health check: `https://your-api.onrender.com/health`
- API docs: `https://your-api.onrender.com/docs`
- Frontend: `https://your-app.vercel.app`

## Troubleshooting

### CORS Errors
- Ensure CORS_ORIGINS matches your frontend URL exactly

### Database Connection
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`

### Empty Data
- Check MOCK_MODE=false in environment
- Verify NEPSE API is accessible

---

**Last Updated:** 2026-04-16