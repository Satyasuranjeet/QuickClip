# QuickClip - Vercel Deployment Guide

## Overview
This app consists of two separate Vercel deployments:
1. **Frontend** (React + Vite) - `client/` folder
2. **Backend** (FastAPI + Python) - `server/` folder

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Get a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **Vercel CLI** (optional): `npm i -g vercel`

---

## Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Whitelist all IPs (`0.0.0.0/0`) for Vercel serverless functions
4. Get your connection string (replace `<password>` with your actual password)

---

## Step 2: Deploy Backend (FastAPI)

### Option A: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Set **Root Directory** to `server`
4. Add Environment Variables:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=quickclip
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   RATE_LIMIT_PER_MINUTE=30
   ```
5. Deploy!

### Option B: Using Vercel CLI

```bash
cd server
vercel --prod
# Follow prompts and add environment variables when asked
```

### After Deployment
- Note your backend URL: `https://your-backend.vercel.app`
- Test the health endpoint: `https://your-backend.vercel.app/health`

---

## Step 3: Deploy Frontend (React)

### Option A: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Set **Root Directory** to `client`
4. Framework Preset should auto-detect as **Vite**
5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```
6. Deploy!

### Option B: Using Vercel CLI

```bash
cd client
vercel --prod
# Set VITE_API_URL when prompted
```

---

## Environment Variables Summary

### Backend (`server/`)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb+srv://...` |
| `DATABASE_NAME` | Database name | `quickclip` |
| `ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `https://app.vercel.app` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `30` |

### Frontend (`client/`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.vercel.app` |

---

## Post-Deployment Setup

### Create TTL Index for Auto-Expiration

The TTL index for automatic clip deletion needs to be created once. Run this in MongoDB Atlas shell or compass:

```javascript
db.clips.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
```

Or use the MongoDB Compass GUI:
1. Connect to your cluster
2. Go to `quickclip` database → `clips` collection
3. Create an index on `expires_at` field with TTL of 0 seconds

---

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that the URL doesn't have a trailing slash

### MongoDB Connection Failed
- Verify `MONGODB_URL` is correct
- Ensure IP `0.0.0.0/0` is whitelisted in Atlas
- Check database user permissions

### API Not Working
- Verify `VITE_API_URL` is set correctly in frontend
- Check Vercel function logs for errors

### Cold Starts
- Serverless functions may have ~1-2s cold start
- Consider upgrading to Vercel Pro for better performance

---

## Local Development

### Backend
```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set up .env file with local MongoDB
uvicorn app:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
# Create .env with VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Project Structure

```
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   ├── vercel.json        # Vercel config for SPA routing
│   └── package.json
│
├── server/                 # Backend (FastAPI)
│   ├── api/
│   │   ├── index.py       # Vercel serverless function
│   │   └── requirements.txt
│   ├── app.py             # Original FastAPI app (for local dev)
│   └── vercel.json        # Vercel Python config
│
└── README.md
```
