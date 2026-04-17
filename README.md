# NEPSE Stock Dashboard V2

A modern, robust NEPSE stock market analysis system with:
- **Live Data** - Real-time prices from NEPSE official API
- **Technical Analysis** - RSI, MACD, Bollinger Bands, Moving Averages
- **ML Predictions** - Random Forest model for next-day price prediction
- **Portfolio Tracking** - Track holdings with P/L
- **Auto-Refresh** - Updates during trading hours
- **Free Hosting** - Vercel + Neon PostgreSQL

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Vercel (Free)                  │
│  ┌──────────────────┬──────────────────────┐   │
│  │  React Frontend  │   Serverless API     │   │
│  │  (Auto-deploy)   │   (GET endpoints)    │   │
│  └──────────────────┴──────────────────────┘   │
└──────────────────────┬─────────────────────────┘
                       │ Cached 5-15 min
         ┌─────────────▼─────────────┐
         │    Neon PostgreSQL        │
         │    (0.5 GB free)          │
         └───────────────────────────┘

GitHub Actions (Free) - Nightly 1AM
┌─────────────────────────────────────────────────┐
│  1. Collect NEPSE data                          │
│  2. Train ML model (Random Forest)             │
│  3. Generate predictions                        │
│  4. Store results in Neon                       │
└─────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **API:** Vercel Serverless Functions
- **Database:** Neon PostgreSQL (0.5 GB free tier)
- **ML:** GitHub Actions + scikit-learn

## Deployment Guide

### Prerequisites
1. [Vercel](https://vercel.com) account (free)
2. [Neon](https://neon.tech) account (free)

### Step 1: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)

### Step 2: Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable:
   - `NEON_DATABASE_URL` = your Neon connection string
4. Deploy

### Step 3: Configure GitHub Secrets

1. Go to GitHub → Settings → Secrets
2. Add `NEON_DATABASE_URL` = your Neon connection string

### Step 4: Trigger Initial Data Collection

1. Go to GitHub → Actions
2. Run "Daily ML Training and Data Collection" manually

## Local Development

### Frontend + API (Vercel)

```bash
cd frontend
npm install
npm run dev
```

API available at: http://localhost:5173/api

### ML Pipeline (Local)

```bash
# Requires DATABASE_URL in environment
export DATABASE_URL="postgresql://..."
python scripts/ml_train.py
```

## API Endpoints

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/stocks` | All stocks | 5 min |
| `GET /api/stocks/:symbol` | Single stock | 5 min |
| `GET /api/stocks/:symbol/history` | Historical data | 1 hour |
| `GET /api/stocks/:symbol/analysis` | Technical analysis | 1 hour |
| `GET /api/market/status` | Market open/closed | 1 min |
| `GET /api/market/summary` | Market summary | 5 min |
| `GET /api/predict/:symbol` | ML prediction | 24 hours |

## Project Structure

```
nepse-stockmarket-v2/
├── frontend/
│   ├── api/                    # Vercel serverless functions
│   │   ├── db.ts              # Neon database connection
│   │   ├── stocks/            # Stock endpoints
│   │   ├── market/            # Market endpoints
│   │   └── predict/           # Prediction endpoints
│   ├── src/
│   │   ├── pages/             # React page components
│   │   └── components/        # UI components
│   └── vercel.json            # Vercel config
├── .github/workflows/
│   └── ml-pipeline.yml        # GitHub Actions for ML
└── README.md
```

## Features

### Completed
- [x] Dashboard with live prices
- [x] Technical analysis (RSI, MACD, Bollinger, MA)
- [x] Neon PostgreSQL for historical data
- [x] ML predictions via pre-computation
- [x] Vercel deployment (frontend + API)
- [x] GitHub Actions for nightly training

### In Progress
- [ ] Portfolio tracking
- [ ] Watchlist
- [ ] Price alerts

## Data Sources

- **Primary:** NEPSE Official API via `api.nepseapi.com`
- **ML Training:** GitHub Actions (free compute)

## License

MIT License
