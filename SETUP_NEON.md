# Neon Database Setup Guide

## Step 1: Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up / Log in with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Project Name:** `nepse-dashboard`
   - **Region:** Choose closest to you (Singapore recommended for Nepal)
   - **Database Name:** `nepse`
5. Click **"Create Project"**
6. On the dashboard, click **"Connection Details"**
7. Copy the **Connection String** (looks like: `postgresql://user:password@host/database`)

## Step 2: Connect to Neon Database

### Option A: Using psql (Recommended)

```bash
# Install psql if not installed
brew install postgresql  # macOS
# or
sudo apt install postgresql-client  # Ubuntu

# Connect
psql "postgresql://user:password@host/database"

# Run setup script
\i scripts/setup-database.sql

# Exit
\q
```

### Option B: Using Python Script

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@host/database"

# Install psycopg2
pip install psycopg2-binary

# Run initialization
python scripts/init_db.py
```

## Step 3: Get Connection String

From Neon Console:
1. Go to your project
2. Click **"Connection Details"**
3. Copy the **Full connection string**

## Step 4: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `NEON_DATABASE_URL`
   - **Value:** Your Neon connection string
5. Click **Save**
6. Go to **Deployments**
7. Click **Redeploy** on the latest deployment

## Step 5: Add to GitHub Secrets

1. Go to [GitHub Repository](https://github.com/smtsrst/nepse-stockmarket-v2)
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name:** `NEON_DATABASE_URL`
   - **Value:** Your Neon connection string
5. Click **"Add secret"**

## Step 6: Trigger First Run

1. Go to GitHub → **Actions** tab
2. Click **"Daily ML Training and Data Collection"**
3. Click **"Run workflow"** → **Run workflow**
4. Wait for it to complete (~5 minutes)

## Verify Setup

```bash
# Test locally (after setting DATABASE_URL)
cd frontend
npx vercel dev

# Visit http://localhost:3000/api/market/status
```

## Troubleshooting

### "Connection refused" error
- Check if Neon project is active (not paused)
- Verify connection string is correct
- Check if your IP is allowed (Neon allows all by default)

### "Permission denied"
- Ensure connection string has correct credentials
- Check if database name is correct

### Tables not created
- Run the setup script again
- Check for any SQL errors in the output
