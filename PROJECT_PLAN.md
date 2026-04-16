# NEPSE Stock Dashboard V2 - Project Plan

**Created:** 2026-04-15
**Version:** 2.0
**Status:** Planning Phase

---

## Project Overview

**Project Name:** NEPSE Stock Dashboard V2
**Purpose:** Build a modern, robust NEPSE stock market analysis system with reliable data, real-time updates, and advanced features.
**Tech Stack:** Python + Streamlit
**Repository:** Separate from current `nepse-stockmarket` project

---

## Goals

1. Build a robust, production-ready stock analysis system
2. Use official NEPSE APIs for reliable data
3. Include features from Laganisutra + unique ML predictions
4. Real-time updates during trading hours
5. Clean, maintainable codebase

---

## Data Sources

### Primary: nepse-data-api (Python Library)
```bash
pip install nepse-data-api
```

**Features:**
- 26+ API endpoints
- Live market data
- Floorsheet data
- Market depth (order book)
- Historical data
- Broker information
- WASM authentication
- Smart caching (5700x faster)

**Documentation:** https://github.com/ra8in/nepse_data_api

### Backup: YONEPSE JSON API
```bash
curl https://shubhamnpk.github.io/yonepse/data/nepse_data.json
```
- Updates every 30 minutes
- Free, no authentication
- Fallback when primary fails

---

## Architecture

```
nepse-stockmarket-v2/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entry point
│   ├── pages/                # Streamlit pages
│   │   ├── __init__.py
│   │   ├── dashboard.py      # Main dashboard
│   │   ├── analysis.py       # Stock analysis
│   │   ├── portfolio.py      # Portfolio tracking
│   │   ├── floorsheet.py    # Floorsheet & broker analytics
│   │   └── settings.py       # Settings & config
│   └── components/           # Reusable UI components
│       ├── __init__.py
│       ├── cards.py
│       ├── charts.py
│       └── tables.py
│
├── core/
│   ├── __init__.py
│   ├── data/                 # Data layer
│   │   ├── __init__.py
│   │   ├── nepse_client.py  # nepse-data-api wrapper
│   │   ├── cache.py         # Caching layer
│   │   └── fallback.py       # YONEPSE fallback
│   │
│   ├── analysis/             # Analysis engine
│   │   ├── __init__.py
│   │   ├── technical.py      # Technical indicators
│   │   ├── fundamental.py   # Fundamental analysis
│   │   └── signals.py       # Signal generation
│   │
│   └── ml/                  # Machine learning
│       ├── __init__.py
│       ├── features.py       # Feature engineering
│       ├── models.py        # ML models
│       └── predictions.py    # Prediction engine
│
├── data/                    # Local data storage
│   └── stocks.db            # SQLite database
│
├── tests/                   # Unit tests
│   ├── __init__.py
│   ├── test_data.py
│   ├── test_analysis.py
│   └── test_ml.py
│
├── config/
│   ├── __init__.py
│   ├── settings.py          # App settings
│   └── constants.py         # Constants
│
├── scripts/
│   ├── backfill.py          # Historical data backfill
│   └── export.py            # Data export utilities
│
├── requirements.txt         # Dependencies
├── README.md               # Documentation
├── LICENSE                # MIT License
├── .gitignore
└── PROJECT_PLAN.md        # This file
```

---

## Features

### Phase 1: Core (MVP)
- [ ] Basic dashboard with live prices
- [ ] Technical analysis (RSI, MACD, Bollinger, MA)
- [ ] Stock recommendations (BUY/SELL/HOLD)
- [ ] SQLite database for historical data
- [ ] Market overview (gainers, losers, indices)

### Phase 2: Advanced Analysis
- [ ] Floorsheet data display
- [ ] Broker analytics (who's buying/selling)
- [ ] Market depth visualization
- [ ] Sector analysis
- [ ] Company fundamentals

### Phase 3: Intelligence
- [ ] ML predictions (Random Forest, Gradient Boosting)
- [ ] Ensemble predictions (Rule + ML)
- [ ] Self-learning weights
- [ ] Backtesting engine
- [ ] Paper trading

### Phase 4: Real-time
- [ ] Auto-refresh during trading hours
- [ ] Browser notifications
- [ ] Price alerts
- [ ] Signal alerts (sound notifications)
- [ ] WebSocket integration (if available)

### Phase 5: Polish
- [ ] Heat maps
- [ ] Advanced screeners
- [ ] Portfolio optimization
- [ ] Export/reports
- [ ] Dark mode

---

## Data Points to Collect

### From nepse-data-api

| Data | Endpoint | Purpose |
|------|----------|---------|
| Live prices | `get_stocks()` | Current prices |
| Market status | `get_market_status()` | Open/closed |
| Market summary | `get_market_summary()` | Turnover, volume |
| Indices | `get_nepse_index()` | NEPSE index |
| Sector indices | `get_sub_indices()` | Sector performance |
| Top gainers | `get_top_gainers()` | Best performers |
| Top losers | `get_top_losers()` | Worst performers |
| Historical | `get_historical_chart()` | Price history |
| Floorsheet | `get_floorsheet()` | Trade details |
| Market depth | `get_market_depth()` | Order book |
| Company info | `get_security_details()` | Fundamentals |
| News | `get_company_news()` | Sentiment |

---

## Technical Analysis Indicators

### Momentum
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Stochastic Oscillator
- Momentum
- ROC (Rate of Change)

### Trend
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)
- Bollinger Bands
- ADX (Average Directional Index)

### Volume
- Volume ratio
- OBV (On-Balance Volume)
- VWAP

### Volatility
- ATR (Average True Range)
- Standard deviation

---

## Database Schema

### Table: stocks
```sql
CREATE TABLE stocks (
    id INTEGER PRIMARY KEY,
    symbol TEXT UNIQUE,
    name TEXT,
    sector TEXT,
    last_updated TIMESTAMP
);
```

### Table: price_history
```sql
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY,
    symbol TEXT,
    date DATE,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    FOREIGN KEY (symbol) REFERENCES stocks(symbol),
    UNIQUE(symbol, date)
);
```

### Table: floorsheet
```sql
CREATE TABLE floorsheet (
    id INTEGER PRIMARY KEY,
    date DATE,
    symbol TEXT,
    buyer_broker TEXT,
    seller_broker TEXT,
    quantity INTEGER,
    price REAL,
    amount REAL
);
```

### Table: analysis_results
```sql
CREATE TABLE analysis_results (
    id INTEGER PRIMARY KEY,
    symbol TEXT,
    date DATE,
    recommendation TEXT,
    score REAL,
    confidence REAL,
    rsi REAL,
    macd REAL,
    signals TEXT,
    UNIQUE(symbol, date)
);
```

---

## Implementation Order

### Week 1: Setup & Data Layer
1. Create repository structure
2. Install `nepse-data-api`
3. Create data client wrapper
4. Set up SQLite database
5. Create caching layer
6. Add YONEPSE fallback
7. Test data retrieval

### Week 2: Dashboard Core
1. Create main Streamlit app
2. Build dashboard page
3. Add market overview
4. Add stock list with filters
5. Add gainers/losers
6. Add indices display

### Week 3: Technical Analysis
1. Create analysis engine
2. Implement RSI, MACD, Bollinger
3. Add moving averages
4. Build signal generation
5. Add recommendations (5 states)
6. Integrate with dashboard

### Week 4: Floorsheet & Broker
1. Fetch floorsheet data
2. Display floorsheet table
3. Add broker analytics
4. Build accumulation/distribution
5. Add market depth chart

### Week 5: ML & Predictions
1. Set up ML framework
2. Create feature engineering
3. Train Random Forest model
4. Train Gradient Boosting model
5. Build ensemble predictor
6. Add backtest engine

### Week 6: Polish & Testing
1. Add portfolio tracking
2. Create settings page
3. Add notifications
4. Performance optimization
5. Bug fixes
6. Documentation

---

## Dependencies

```
# Core
streamlit>=1.0.0
pandas>=1.5.0
numpy>=1.21.0

# Data
nepse-data-api>=1.0.0
requests>=2.28.0

# Visualization
plotly>=5.0.0

# ML
scikit-learn>=1.0.0

# Utilities
python-dotenv>=1.0.0
```

---

## GitHub Repository Setup

```bash
cd ~/Documents/nepse-stockmarket-v2

# Initialize git
git init

# Create .gitignore
echo "venv/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.db" >> .gitignore
echo ".streamlit/" >> .gitignore
echo "*.pyc" >> .gitignore

# Create README
# (Create initial README.md)

# Commit
git add .
git commit -m "Initial commit - Project structure"

# Create remote on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/nepse-stockmarket-v2.git
git branch -M main
git push -u origin main
```

---

## Quick Start Commands

### Installation
```bash
cd ~/Documents/nepse-stockmarket-v2
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run Dashboard
```bash
streamlit run app/main.py
```

### Run Tests
```bash
pytest tests/
```

---

## Key Files Reference

### Current Project (for reference)
- Location: `~/Documents/nepse-stockmarket`
- Scripts: `scripts/dashboard.py`
- Database: `database/stocks.db`

### nepse-data-api Documentation
- PyPI: https://pypi.org/project/nepse-data-api/
- GitHub: https://github.com/ra8in/nepse_data_api

### YONEPSE JSON API
- Dashboard: https://shubhamnpk.github.io/yonepse/
- Docs: https://shubhamnpk.github.io/yonepse/docs.html

---

## Lessons from Current Project

### What Worked
- Simple tab-based dashboard
- Auto-refresh during trading hours
- Clear recommendation states (5 levels)
- AI prompt generator for ChatGPT integration
- Self-learning weights from backtest

### What to Improve
- Web scraping is fragile (HTML changes break things)
- No dedicated data layer
- Code organization could be cleaner
- Missing floorsheet/broker data
- No real-time WebSocket

### What V2 Should Do Differently
- Use official API (nepse-data-api) instead of scraping
- Modular architecture
- Proper caching layer
- Include floorsheet/broker analytics
- Clean separation of concerns

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Data reliability | 99%+ uptime |
| API response time | < 1 second |
| Recommendation accuracy | > 65% |
| Code coverage | > 80% |
| Documentation | Complete |

---

## Next Steps

1. [ ] Create GitHub repository
2. [ ] Set up project structure
3. [ ] Install dependencies
4. [ ] Test nepse-data-api
5. [ ] Create data layer
6. [ ] Build basic dashboard
7. [ ] Add technical analysis
8. [ ] Integrate with dashboard
9. [ ] Test and iterate

---

## Notes

- Keep this project separate from `nepse-stockmarket`
- Use Python 3.10+ for best compatibility
- Follow PEP 8 style guide
- Write tests for critical functions
- Document all public functions
- Use type hints where possible

---

**End of Project Plan**
