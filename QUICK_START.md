# Quick Start Guide

## Setup Instructions

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `nepse-stockmarket-v2`
3. Select **Private**
4. Click **Create repository** (don't add README)

### 2. Initialize Local Repository

```bash
cd ~/Documents/nepse-stockmarket-v2
git init
git add .
git commit -m "Initial commit - NEPSE Dashboard V2"
git remote add origin https://github.com/YOUR_USERNAME/nepse-stockmarket-v2.git
git branch -M main
git push -u origin main
```

### 3. Install Dependencies

```bash
cd ~/Documents/nepse-stockmarket-v2
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run the Dashboard

```bash
streamlit run app/main.py
```

---

## Next Steps

### Priority 1: Test Data Connection
- Verify `nepse-data-api` works
- Check if live data loads

### Priority 2: Build Dashboard
- Add market overview
- Add stock list
- Add gainers/losers

### Priority 3: Add Technical Analysis
- Implement RSI, MACD, Bollinger
- Generate signals

### Priority 4: Add Floorsheet
- Fetch floorsheet data
- Add broker analytics

---

## Current Status

| Component | Status |
|-----------|--------|
| Project structure | ✅ Done |
| Requirements | ✅ Done |
| Basic dashboard | ✅ Done |
| Data client | ✅ Done |
| GitHub repo | ⬜ Pending |
| Test data connection | ⬜ Pending |
| Full features | ⬜ Pending |

---

## File Structure

```
nepse-stockmarket-v2/
├── app/
│   ├── main.py           # Main dashboard
│   └── components/       # UI components
├── core/
│   ├── data/            # Data layer
│   │   └── nepse_client.py
│   ├── analysis/        # Technical analysis
│   └── ml/              # ML models
├── config/              # Configuration
├── data/                # Local storage
├── tests/               # Unit tests
├── requirements.txt
├── README.md
├── PROJECT_PLAN.md
└── LICENSE
```

---

## Reference

- **nepse-data-api:** https://github.com/ra8in/nepse_data_api
- **YONEPSE (fallback):** https://shubhamnpk.github.io/yonepse
- **Current project:** ~/Documents/nepse-stockmarket
