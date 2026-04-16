# NEPSE Stock Dashboard V2 - Implementation Plan

**Created:** 2026-04-16
**Version:** 3.0
**Status:** Ready for Implementation

---

## Executive Summary

Migration from Streamlit to React + Vite + FastAPI with full-stack capabilities including:
- Lumina Invest-inspired dark UI
- Personalized portfolios with database
- JWT authentication
- Technical analysis backend
- ML predictions (postponed)
- Real-time polling (10-30 seconds)
- Deployed on Vercel + Render

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEPSE Stock Dashboard V3                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐          ┌──────────────────────────────┐   │
│  │                    │          │                              │   │
│  │   React + Vite     │◄────────►│   FastAPI (Python)          │   │
│  │   Frontend        │  REST    │   Backend                │   │
│  │   (Port 5173)   │   API    │   (Port 8000)          │   │
│  │                    │          │                          │   │
│  │  - Lumina UI     │          │  - nepse-data-api        │   │
│  │  - Recharts    │          │  - SQLAlchemy          │   │
│  │  - Tailwind   │          │  - JWT Auth           │   │
│  │  - TypeScript │          │  - Technical Analysis│   │
│  └──────────────────────┘          └──────────────────────────────┘   │
│               │                               │                      │
│               │                               │                      │
│          Vercel ◄──────────────────────► Render                     │
│          (Frontend)                    (Backend)                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | FastAPI | >=0.100.0 | REST API |
| Server | Uvicorn | >=0.23.0 | ASGI server |
| Database | SQLite (dev) | - | Local development |
| Database | PostgreSQL | >=15 | Production |
| ORM | SQLAlchemy | >=2.0 | Database operations |
| Auth | python-jose | >=3.3 | JWT tokens |
| Password | bcrypt | >=4.0 | Password hashing |
| Data | nepse-data-api | >=1.0 | NEPSE data |
| Analysis | pandas | >=1.5 | Data processing |
| ML | scikit-learn | >=1.0 | Future ML |

### Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.x | UI library |
| Build | Vite | 5.x | Build tool |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Styling |
| Charts | Recharts | 2.x | Charts |
| Icons | Lucide React | - | Icons |
| HTTP | Axios | 1.x | API calls |
| Routing | React Router | 6.x | Navigation |
| Date | date-fns | 3.x | Date handling |

---

## 3. Project Structure

```
nepse-stockmarket-v2/
│
├── IMPLEMENTATION_PLAN.md           ← This plan
├── README.md                     ← Updated
├── PROJECT_PLAN.md               ← Keep original
├── QUICK_START.md              ← Updated
│
├── .backup/                          # Backup system
│   └── backups/                    # Timestamped backups
│
├── backend/                        # NEW: FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI entry point
│   │   ├── config.py             # Configuration
│   │   ├── database.py          # Database setup
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── security.py        # Auth & security
│   │   ├── api/              # API routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication
│   │   │   ├── market.py      # Market data
│   │   │   ├── stocks.py     # Stock data
│   │   │   ├── portfolio.py # Portfolio
│   │   │   └── analysis.py  # Technical analysis
│   │   └── core/              # Business logic
│   │       ├── __init__.py
│   │       ├── client.py       # NepseClient
│   │       ├── analysis.py    # Technical indicators
│   │       └── ml/            # ML (future)
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   └── alembic.ini            # Database migrations
│
├── frontend/                       # NEW: React frontend
│   ├── public/
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Main app
│   │   ├── index.css          # Global styles
│   │   ├── api/             # API client
│   │   │   └── client.ts
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout/
│   │   │   ├── Charts/
│   │   │   ├── Tables/
│   │   │   └── Cards/
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Analysis.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Floorsheet.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/        # Utilities
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── core/                        # KEEP: Existing analysis
│   ├── data/
│   ├── analysis/
│   └── ml/
│
├── config/                    # KEEP: Configuration
├── tests/                   # KEEP: Tests
│
└── data/                   # Local data storage
    └── nepse.db            # SQLite database
```

---

## 4. Security Implementation

### Authentication Flow

```
User Login Flow:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │───►│  Login  │───►│ Backend │───►│  JWT    │
│  enters  │    │  form   │    │  validates│   │ Token   │
│  email   │    │         │    │         │    │ issued  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
       │                                        │
       │         Protected Request Flow:             │
       ▼                                        ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Request │───►│ Add JWT │───►│ Verify  │───►│ Return  │
│  with    │    │  to     │    │  token │    │  data  │
│  token  │    │ Header │    │        │    │        │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Security Measures

| Measure | Implementation | Priority |
|---------|--------------|----------|
| Password hashing | bcrypt with salt | Required |
| JWT tokens | 30min access + 7d refresh | Required |
| CORS | Specific origins only | Required |
| Rate limiting | 100req/min per user | Required |
| Input validation | Pydantic models | Required |
| SQL injection | SQLAlchemy ORM | Required |
| XSS | React auto-escape | Required |
| HTTPS | Enforce in production | Required |
| API keys | Environment variables | Required |

---

## 5. Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Portfolios Table

```sql
CREATE TABLE portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Holdings Table

```sql
CREATE TABLE holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id),
    symbol VARCHAR(20) NOT NULL,
    quantity NUMERIC NOT NULL,
    avg_price NUMERIC NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, symbol)
);
```

### Transaction History Table

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id),
    symbol VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,  -- BUY or SELL
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. API Endpoints

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|-----|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login, get tokens |
| `/api/auth/refresh` | POST | Refresh | Refresh access token |
| `/api/auth/me` | GET | Access | Get current user |

### Market Data

| Endpoint | Method | Auth | Description |
|----------|--------|-----|-------------|
| `/api/market/status` | GET | No | Market open/closed |
| `/api/market/summary` | GET | No | Turnover, volume |
| `/api/market/indices` | GET | No | NEPSE + sector indices |

### Stocks

| Endpoint | Method | Auth | Description |
|----------|--------|-----|-------------|
| `/api/stocks` | GET | No | All stock prices |
| `/api/stocks/{symbol}` | GET | No | Single stock |
| `/api/stocks/gainers` | GET | No | Top gainers |
| `/api/stocks/losers` | GET | No | Top losers |
| `/api/stocks/{symbol}/history` | GET | No | Price history |
| `/api/stocks/{symbol}/analysis` | GET | No | Technical indicators |

### Portfolio

| Endpoint | Method | Auth | Description |
|----------|--------|-----|-------------|
| `/api/portfolio` | GET | Yes | Get user portfolios |
| `/api/portfolio` | POST | Yes | Create portfolio |
| `/api/portfolio/{id}` | GET | Yes | Get portfolio details |
| `/api/portfolio/{id}` | PUT | Yes | Update portfolio |
| `/api/portfolio/{id}` | DELETE | Yes | Delete portfolio |
| `/api/portfolio/{id}/holdings` | GET | Yes | Get holdings |
| `/api/portfolio/{id}/holdings` | POST | Yes | Add holding |
| `/api/portfolio/{id}/holdings/{symbol}` | PUT | Yes | Update holding |
| `/api/portfolio/{id}/holdings/{symbol}` | DELETE | Yes | Remove holding |
| `/api/portfolio/{id}/performance` | GET | Yes | Performance metrics |

### Floorsheet

| Endpoint | Method | Auth | Description |
|----------|--------|-----|-------------|
| `/api/floorsheet` | GET | No | Latest floorsheet |
| `/api/floorsheet/{symbol}` | GET | No | Symbol floorsheet |

---

## 7. Backup & Restore Strategy

### Backup System

```
Backup Architecture:
┌─────────────────────────────────────────────────────────────┐
│                   BACKUP SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                      │
│   Local Backup        ◄──────►   Remote Backup        │
│   (.backup/)                (GitHub)                 │
│                                                      │
│   ┌──────────┐           ┌──────────┐               │
│   │ Auto     │           │ Git      │               │
│   │ backup   │──────────►│ commits  │               │
│   │ daily    │           │ 2x/day   │               │
│   └──────────┘           └──────────┘               │
│                                                      │
│   ┌──────────┐           ┌──────────┐               │
│   │ DB       │──────────► │ DB       │                │
│   │ export   │           │ import   │               │
│   └──────────┘           └──────────┘               │
│                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Backup Schedule

| Backup Type | Frequency | Location | Retention |
|------------|-----------|----------|-----------|
| Code | Every 2 hours | .backup/code/ | 7 days |
| Database | Daily at 6 PM | .backup/db/ | 30 days |
| Config | On change | .backup/config/ | 10 versions |
| GitHub | 2x daily auto | Remote | Forever |

### Checkpoint System

| Checkpoint | Trigger | Can Restore To |
|-----------|---------|----------------|
| Phase 1 | Project structure done | Original state |
| Phase 2 | Backend API ready | Backend working |
| Phase 3 | Auth complete | All auth works |
| Phase 4 | Portfolio done | Portfolio works |
| Phase 5 | Market data ready | Market data works |
| Phase 6 | Frontend basic | Basic UI works |
| Phase 7 | All pages | Full app |
| Phase 8 | Deploy ready | Production |

### Restore Procedure

```bash
# Restore code from backup
cp -r .backup/code/[timestamp]/* .

# Restore database
python -c "import sqlite3; conn = sqlite3.connect('nepse.db'); conn.executescript(open('.backup/db/[timestamp].sql').read())"

# Hard reset to last git commit
git reset --hard HEAD
```

---

## 8. Implementation Phases

### Phase 1: Project Setup (Checkpoint 1)

**Duration:** 2-3 hours

| Task | File | Description |
|------|------|-------------|
| Create backup directory | `.backup/` | Backup structure |
| Create backend structure | `backend/` | FastAPI skeleton |
| Create frontend structure | `frontend/` | React + Vite |
| Set up git backup | `.git/hooks/` | Auto backup hook |
| Test run backend | - | Verify FastAPI runs |
| Test run frontend | - | Verify React runs |

**Checkpoint 1: Project structure ready, both servers can start**

---

### Phase 2: Database & Models (Checkpoint 2)

**Duration:** 2-3 hours

| Task | File | Description |
|------|------|-------------|
| Database setup | `backend/app/database.py` | SQLAlchemy setup |
| User model | `backend/app/models.py` | User model |
| Portfolio models | `backend/app/models.py` | Portfolio, Holdings |
| Pydantic schemas | `backend/app/schemas.py` | Request/Response |
| Database init | - | Create tables |

**Checkpoint 2: Database ready, tables created**

---

### Phase 3: Authentication (Checkpoint 3)

**Duration:** 2-3 hours

| Task | File | Description |
|------|------|-------------|
| Security utils | `backend/app/security.py` | JWT, password utils |
| Auth API | `backend/app/api/auth.py` | Register, login, refresh |
| Protected route test | - | Test with token |

**Checkpoint 3: Auth working, users can register/login**

---

### Phase 4: Portfolio API (Checkpoint 4)

**Duration:** 2-3 hours

| Task | File | Description |
|------|------|-------------|
| Portfolio API | `backend/app/api/portfolio.py` | CRUD endpoints |
| Holdings API | - | Add, update, remove |
| Performance calc | - | P/L calculations |

**Checkpoint 4: Portfolio CRUD working, holdings track**

---

### Phase 5: Market Data API (Checkpoint 5)

**Duration:** 3-4 hours

| Task | File | Description |
|------|------|-------------|
| Market endpoints | `backend/app/api/market.py` | Status, summary, indices |
| Stock endpoints | `backend/app/api/stocks.py` | Prices, history |
| Floorsheet endpoints | - | Floorsheet data |
| Analysis endpoints | - | Technical indicators |

**Checkpoint 5: All market data endpoints working**

---

### Phase 6: Frontend Basic (Checkpoint 6)

**Duration:** 3-4 hours

| Task | File | Description |
|------|------|-------------|
| React setup | `frontend/` | Dependencies |
| Tailwind setup | `tailwind.config.js` | Colors, theme |
| Layout component | `Layout/` | Sidebar, header |
| Routing | `App.tsx` | Page routes |
| Auth pages | `pages/Login.tsx` | Login form |
| API client | `api/client.ts` | Axios setup |

**Checkpoint 6: Frontend runs, auth flow works**

---

### Phase 7: Dashboard Pages (Checkpoint 7)

**Duration:** 6-8 hours

| Task | File | Description |
|------|------|-------------|
| Dashboard page | `pages/Dashboard.tsx` | Market overview |
| Stock table | `components/Tables/StockTable.tsx` | With sorting |
| Charts | `components/Charts/PriceChart.tsx` | Recharts |
| Analysis page | `pages/Analysis.tsx` | Technical details |
| Portfolio page | `pages/Portfolio.tsx` | Holdings view |
| Floorsheet page | `pages/Floorsheet.tsx` | Floorsheet data |

**Checkpoint 7: All pages render data**

---

### Phase 8: Polish & Deploy (Checkpoint 8)

**Duration:** 3-4 hours

| Task | Description |
|------|-------------|
| Theme polish | Lumina-style dark theme |
| Responsive fix | Mobile view |
| Vercel deploy | Frontend |
| Render deploy | Backend |
| Environment config | Production variables |
| Final test | End-to-end |

**Checkpoint 8: Deployed and working**

---

## 9. Milestones

| Milestone | Description | Target |
|-----------|------------|--------|
| M1 | Backend API running | Day 1 |
| M2 | Database + Auth ready | Day 1 |
| M3 | Portfolio API complete | Day 2 |
| M4 | Market data API complete | Day 2 |
| M5 | Frontend basic UI | Day 3 |
| M6 | All pages functional | Day 4 |
| M7 | Lumina-style polish | Day 4 |
| M8 | Production deploy | Day 5 |

---

## 10. Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS errors | Frontend not in allowed origins | Update CORS settings |
| JWT expired | Token too old | Implement refresh |
| DB connection | Wrong connection string | Check DATABASE_URL |
| Import errors | Missing deps | pip install -r requirements.txt |
| Vite proxy | API not reachable | Update vite.config.ts |
| Tailwind not working | Config issue | Check content paths |

### Emergency Restore

```bash
# Stop everything
pkill -f uvicorn
pkill -f "vite"

# Restore from last checkpoint
git status
git log --oneline -10  # Find last good commit
git checkout [commit-hash]

# Reinstall and restart
cd backend && pip install -r requirements.txt
cd frontend && npm install
```

---

## 11. Security Checklist

- [ ] Environment variables in .env (not committed)
- [ ] CORS restricted to specific origins
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens have expiration
- [ ] SQL injection prevented via ORM
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS enforced in production
- [ ] No secrets in git commits
- [ ] API keys in environment variables
- [ ] Backup of sensitive data encrypted

---

## 12. Data Safety Checklist

- [ ] Daily automatic database backups
- [ ] Code backed up every 2 hours
- [ ] Config files versioned
- [ ] Git remote configured
- [ ] Backup location verified
- [ ] Restore procedure tested
- [ ] Checkpoints documented
- [ ] Rollback plan ready

---

## 13. Dependencies

### Backend Requirements

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
sqlalchemy>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
nepse-data-api>=1.0.0
pandas>=1.5.0
numpy>=1.21.0
scikit-learn>=1.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
psycopg2-binary>=2.9.0
alembic>=1.11.0
python-dotenv>=1.0.0
```

### Frontend Dependencies

```
react@^18.2.0
react-dom@^18.2.0
react-router-dom@^6.20.0
recharts@^2.10.0
lucide-react@^0.300.0
axios@^1.6.0
date-fns@^3.0.0
```

### Frontend Dev Dependencies

```
@types/react@^18.2.0
@types/react-dom@^18.2.0
@vitejs/plugin-react@^4.2.0
typescript@^5.3.0
vite@^5.0.0
tailwindcss@^3.4.0
autoprefixer@^10.4.0
postcss@^8.4.0
```

---

## 14. Deployment Guide

### Vercel (Frontend)

1. Push code to GitHub
2. Go to vercel.com, import repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

### Render (Backend)

1. Push code to GitHub
2. Go to render.com, create new Web Service
3. Connect GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
6. Add environment variables
7. Deploy

---

## 15. Quick Reference Commands

### Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Backup

```bash
# Manual backup
./scripts/backup.sh

# Restore
./scripts/restore.sh [backup-id]
```

### Deployment

```bash
# Build frontend
cd frontend
npm run build

# Deploy (after git push)
# Auto-deploys via Vercel/Render hooks
```

---

## 16. Contacts & References

- **nepse-data-api:** https://github.com/ra8in/nepse_data_api
- **Lumina Invest:** https://github.com/Spaghetih/lumina-invest
- **FastAPI:** https://fastapi.tiangolo.com
- **React + Vite:** https://vitejs.dev
- **Tailwind:** https://tailwindcss.com

---

**Document Version:** 3.0
**Last Updated:** 2026-04-16
**Status:** Ready for Implementation

---

## Appendix A: Checkpoint Log

| Checkpoint | Date | Status | Notes |
|------------|------|--------|-------|
| CP1 | - | ☐ Pending | Project structure |
| CP2 | - | ☐ Pending | Database |
| CP3 | - | ☐ Pending | Authentication |
| CP4 | - | ☐ Pending | Portfolio API |
| CP5 | - | ☐ Pending | Market data API |
| CP6 | - | ☐ Pending | Frontend basic |
| CP7 | - | ☐ Pending | All pages |
| CP8 | - | ☐ Pending | Deployed |

---

## Appendix B: Environment Variables

### Backend (.env)

```
# Database
DATABASE_URL=sqlite:///./nepse.db
# Or for PostgreSQL: postgresql://user:pass@localhost:5432/nepse

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# NEPSE API (optional)
NEPSE_API_KEY=your-nepse-key

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000/api
# Or for production: https://your-render-app.onrender.com/api
```

---

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-15 | Initial project plan (Streamlit) |
| 2.0 | 2026-04-15 | Switched to React + Vite |
| 3.0 | 2026-04-16 | Added auth, portfolio, backup, security |