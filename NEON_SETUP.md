# Neon Database Setup Guide (Manual)

## Step 1: Create Neon Account & Project

1. Go to **https://neon.tech**
2. Click **"Sign Up"** → Sign in with **GitHub**
3. Click **"New Project"**
4. Fill in:
   - **Project Name:** `nepse-dashboard`
   - **Region:** `Singapore` (closest to Nepal)
   - **Database Name:** `nepse`
5. Click **"Create Project"**

## Step 2: Get Connection String

1. In the Neon dashboard, click **"Connection Details"**
2. Copy the **Full connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/nepse?sslmode=require
   ```

## Step 3: Add to Vercel

1. Go to **https://vercel.com/dashboard**
2. Select your project → **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEON_DATABASE_URL`
   - **Value:** Your connection string (from Step 2)
4. Click **Save**
5. Go to **Deployments** → Click **"..."** → **Redeploy** on the latest deployment

## Step 4: Add to GitHub Secrets

1. Go to **https://github.com/smtsrst/nepse-stockmarket-v2/settings/secrets/actions**
2. Click **"New repository secret"**
3. Add:
   - **Name:** `NEON_DATABASE_URL`
   - **Value:** Your connection string (from Step 2)
4. Click **"Add secret"**

## Step 5: Initialize Database Tables

### Option A: Using Neon SQL Editor (Easiest)

1. In Neon dashboard, click **"SQL Editor"**
2. Run this SQL:

```sql
-- Stock Prices Table
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_prices(date);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    prediction TEXT,
    confidence REAL,
    current_price REAL,
    predicted_price REAL,
    change_percent REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON predictions(symbol);

-- Metadata Table
CREATE TABLE IF NOT EXISTS market_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Option B: Using psql (Command Line)

```bash
# Install psql
brew install postgresql  # macOS
# or
sudo apt install postgresql-client  # Ubuntu

# Connect (use your connection string)
psql "postgresql://username:password@host/database?sslmode=require"

# Run the SQL above
```

## Step 6: Verify Setup

Test the API with historical data:

```bash
curl "https://frontend-eight-tan-70.vercel.app/api/stocks/NABIL/history?days=30"
```

Should return historical price data.

## Step 7: Trigger ML Training (Optional)

1. Go to **https://github.com/smtsrst/nepse-stockmarket-v2/actions**
2. Click **"Daily ML Training and Data Collection"**
3. Click **"Run workflow"** → **"Run workflow"**

---

## Troubleshooting

### "Connection refused"
- Check if Neon project is **active** (not paused)
- Verify connection string is correct
- Make sure to include `?sslmode=require`

### "Permission denied"
- Connection string may have wrong credentials
- Double-check username/password

### Tables not created
- Ensure you're connected to the correct database
- Check for any error messages in the SQL output
