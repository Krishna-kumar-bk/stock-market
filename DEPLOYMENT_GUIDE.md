# Stock Market Project Deployment Guide

## Current Issue
Your frontend is trying to fetch stock data from `https://stock-market-26i6.onrender.com/api` but requests are pending/failing.

## Deployment Steps

### 1. Backend Deployment (Render)

**Files Created/Updated:**
- `stock-backend/render.yaml` - Render configuration
- `stock-backend/start.sh` - Fixed startup script (removed --reload for production)

**Steps:**
1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Connect your GitHub repository
4. Create a new "Web Service"
5. Select the `stock-backend` folder
6. Use these settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `bash start.sh`
   - **Health Check Path**: `/api/health`

**Environment Variables to Set in Render:**
```
DATABASE_URL=postgresql://postgres:Krish123Krish@db.pwkpdmjpltxhasfweanj.supabase.co:5432/postgres
SECRET_KEY=be2f2af7e9eb78d9f30f3f0d5c705b715ff0b4b76396d157c079a6207167cd26
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SUPABASE_URL=https://pwkpdmjpltxhasfweanj.supabase.co
SUPABASE_KEY=sb_publishable__3eug5Sy9JjXcRDMHnAwhw_r-KMaHKK
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=23csec45.krishnakumar@gmail.com
EMAIL_PASSWORD=kfdvjzfpeyrattpe
FRONTEND_URL=https://your-netlify-url.netlify.app
```

### 2. Frontend Deployment (Netlify)

**Files Updated:**
- `netlify.toml` - Added environment variable and API proxy
- `stock-frontend/src/services/api.js` - Dynamic backend URL

**Steps:**
1. Push your code to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. Connect your GitHub repository
4. Use these settings:
   - **Base directory**: `stock-frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist`

**Environment Variables to Set in Netlify:**
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3. Supabase Database (Already Configured)

Your Supabase database is already configured in the `.env` file:
- **URL**: `https://pwkpdmjpltxhasfweanj.supabase.co`
- **Database**: PostgreSQL connection already set up

## Fixing the Current Issue

The problem is likely one of these:

1. **Wrong Backend URL**: Update `VITE_API_URL` in Netlify with your actual Render URL
2. **CORS Issues**: Your backend has CORS middleware, but ensure the frontend URL is allowed
3. **Backend Not Deployed**: The backend URL `stock-market-26i6.onrender.com` may not exist

## Testing After Deployment

1. **Backend Health Check**: Visit `https://your-backend-url.onrender.com/api/health`
2. **Frontend**: Visit your Netlify URL and check browser network tab
3. **Stock Data**: Check if `/api/stocks/quote` calls are working

## API Endpoints Available

**Authentication:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Stock Data:**
- `GET /api/stocks/quote?symbol=SYMBOL`
- `GET /api/stocks/history?symbol=SYMBOL&range=6mo`
- `GET /api/stocks/predict?symbol=SYMBOL`
- `GET /api/stocks/news?symbol=SYMBOL`

**User Features:**
- `GET /api/watchlist/{user_id}`
- `POST /api/watchlist/add`
- `DELETE /api/watchlist/{user_id}/{symbol}`
- `GET /api/alerts/{user_id}`
- `POST /api/alerts/create`

## Troubleshooting

**If stock data isn't loading:**
1. Check if backend is deployed correctly
2. Verify the API URL in Netlify environment variables
3. Check browser console for CORS errors
4. Test backend endpoints directly in browser

**If database issues:**
1. Verify Supabase connection string
2. Check if database tables are created
3. Review environment variables in Render
