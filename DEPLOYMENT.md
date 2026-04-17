# Deployment Guide

## Automatic GitHub Deployments

This project uses **Vercel GitHub Integration** for automatic deployments.

### How it works:
1. Push code to `main` branch on GitHub
2. Vercel automatically builds and deploys
3. No manual deployment steps needed

### Project Structure
```
frontend/
├── api/           # Serverless API endpoints
├── src/           # React frontend
├── vercel.json    # Vercel configuration
└── package.json   # Dependencies
```

### Git Workflow
```bash
cd frontend
git add .
git commit -m "Your changes"
git push origin main
```

### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/stocks` | All stocks with live data |
| `/api/stocks/gainers` | Top gaining stocks |
| `/api/stocks/losers` | Top losing stocks |
| `/api/market/status` | Market status |
| `/api/market/summary` | Market summary |
| `/api/history?symbol=X&days=N` | Historical prices from DB |
| `/api/analysis?symbol=X` | Technical analysis |
| `/api/predict?symbol=X` | ML predictions |

### Available Symbols in Database
- GBL, NABIL, NIC, SCB, NMB (5 stocks)

### Troubleshooting
1. **Build fails**: Check `vercel.json` configuration
2. **API errors**: Verify `DATABASE_URL` in Vercel environment variables
3. **Deployment stuck**: Check Vercel dashboard at vercel.com

### Environment Variables
Set in Vercel dashboard > Project > Settings > Environment Variables:
- `DATABASE_URL`: Neon PostgreSQL connection string

### Production URL
https://frontend-eight-tan-70.vercel.app
