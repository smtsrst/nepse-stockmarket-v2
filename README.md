# NEPSE Stock Dashboard V2

A modern, robust NEPSE stock market analysis system with:
- **Live Data** - Real-time prices from NEPSE official API
- **Technical Analysis** - RSI, MACD, Bollinger Bands, Moving Averages
- **Floorsheet Analytics** - Broker buying/selling patterns
- **ML Predictions** - Ensemble (Rule + ML) recommendations (coming soon)
- **Portfolio Tracking** - Track holdings with P/L
- **Auto-Refresh** - Updates during trading hours
- **JWT Authentication** - Secure user accounts

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python + SQLAlchemy
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT + bcrypt
- **Data:** nepse-data-api

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API available at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

## Project Structure

```
nepse-stockmarket-v2/
├── backend/           # FastAPI backend
│   └── app/
│       ├── main.py  # Entry point
│       ├── api/   # API routes
│       └── core/  # Business logic
├── frontend/          # React frontend
│   └── src/
│       ├── pages/  # Page components
│       └── components/  # UI components
├── core/             # ML/Analysis (legacy)
├── .backup/          # Backup storage
└── scripts/         # Backup/restore scripts
```

## Features

### Phase 1: Core (MVP)
- [x] Basic dashboard with live prices
- [x] Technical analysis (RSI, MACD, Bollinger, MA)
- [x] SQLite database for historical data
- [x] Market overview (gainers, losers, indices)

### Phase 2: Advanced Analysis
- [ ] Floorsheet data display
- [ ] Broker analytics
- [ ] Market depth visualization
- [ ] Sector analysis
- [ ] Company fundamentals

### Phase 3: Intelligence (ML)
- [ ] ML predictions (Random Forest, Gradient Boosting)
- [ ] Ensemble predictions (Rule + ML)
- [ ] Backtesting engine

### Phase 4: Real-time
- [ ] Auto-refresh during trading hours
- [ ] Price alerts
- [ ] Browser notifications

## Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Full implementation plan
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Original project plan
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

## Data Sources

- **Primary:** NEPSE Official API via `nepse-data-api`
- **Backup:** YONEPSE JSON API

## License

MIT License