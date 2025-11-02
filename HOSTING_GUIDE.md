# 🌐 BK-PULSE Hosting Guide

**Free Hosting Options for Academic Capstone Projects**

---

## 🎯 Recommended Hosting Platforms

### Option 1: **Render** (Recommended) ⭐
- ✅ Free PostgreSQL database included
- ✅ Free web service (sleeps after inactivity)
- ✅ Easy deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ✅ Perfect for academic projects

### Option 2: **Railway**
- ✅ Free tier with $5 credit/month
- ✅ PostgreSQL included
- ✅ Easy GitHub integration
- ✅ Good for demos

### Option 3: **Vercel + Supabase**
- ✅ Vercel: Free frontend hosting
- ✅ Supabase: Free PostgreSQL database
- ✅ Best performance
- ⚠️ Requires two services

---

## 🚀 Option 1: Deploy to Render (Recommended)

### Prerequisites
1. GitHub account
2. Render account (free at https://render.com)
3. Your project pushed to GitHub

### Step 1: Push Your Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bk-pulse.git
git branch -M main
git push -u origin main
```

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `bk-pulse-db`
   - **Database:** `bk_pulse`
   - **User:** (auto-generated)
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **"Create Database"**
5. **IMPORTANT:** Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 3: Deploy Backend (Web Service)

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `bk-pulse-backend`
   - **Environment:** Node
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free

4. **Add Environment Variables:**
   ```
   DB_HOST=your_db_host_from_internal_url
   DB_PORT=5432
   DB_NAME=bk_pulse
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   PORT=10000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

   **OR use the Internal Database URL directly:**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/bk_pulse
   ```

5. Click **"Create Web Service"**

### Step 4: Update Database Configuration

You may need to update `server/config/database.js` to support the `DATABASE_URL` format:

```javascript
// server/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'bk_pulse',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
);

module.exports = pool;
```

### Step 5: Deploy Frontend (Static Site)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `bk-pulse-frontend`
   - **Branch:** `main`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://bk-pulse-backend.onrender.com/api
     ```
4. Click **"Create Static Site"**

### Step 6: Initialize Database

After backend is deployed, run database setup:

1. Go to your backend service in Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   # Install dependencies
   npm install
   
   # Run schema
   psql $DATABASE_URL -f sql/schema.sql
   
   # Seed initial data (optional)
   psql $DATABASE_URL -f sql/seed.sql
   ```

**OR** use Render's PostgreSQL dashboard to run SQL scripts manually.

### Step 7: Update CORS

Update `CORS_ORIGIN` in backend environment variables to match your frontend URL:
```
CORS_ORIGIN=https://bk-pulse-frontend.onrender.com
```

Redeploy the backend after updating.

---

## 🚂 Option 2: Deploy to Railway

### Step 1: Create Railway Account

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your repository

### Step 3: Add PostgreSQL

1. In your project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates the database

### Step 4: Deploy Backend

1. Railway detects your Node.js project
2. Configure:
   - **Root Directory:** `server`
   - **Start Command:** `node index.js`
3. Add environment variables:
   - Railway automatically adds `DATABASE_URL`
   - Add others:
     ```
     JWT_SECRET=your_super_secret_jwt_key
     JWT_EXPIRE=7d
     NODE_ENV=production
     PORT=3000
     ```

### Step 5: Update Database Config

Use the same `DATABASE_URL` support in `server/config/database.js` as shown in Render section.

### Step 6: Deploy Frontend

1. Add another service in Railway
2. Select your repo again
3. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l 3000`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```

---

## 🎨 Option 3: Vercel (Frontend) + Supabase (Database)

### Frontend on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://your-backend-url.vercel.app/api
     ```

### Database on Supabase

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Get connection string from **Settings** → **Database**
4. Use connection string in your backend

---

## 📝 Important Notes

### Database Connection String Format

If your hosting provider gives you a `DATABASE_URL`, make sure `server/config/database.js` supports it (see Step 4 of Render guide).

### Environment Variables Summary

**Backend Required:**
```
DB_HOST (or DATABASE_URL)
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
JWT_EXPIRE
PORT
NODE_ENV=production
CORS_ORIGIN
```

**Frontend Required:**
```
REACT_APP_API_URL
```

### ML Predictions on Cloud

⚠️ **Note:** ML predictions require Python. Some platforms support this, others may require:
- Using an external ML service API
- Running ML predictions separately
- Using serverless functions for ML

For academic purposes, you can:
1. Pre-compute predictions and store in database
2. Disable real-time ML predictions
3. Use platforms that support Python (Render, Railway with custom Docker)

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database connection working
- [ ] Environment variables set
- [ ] Database schema initialized
- [ ] CORS configured correctly
- [ ] Test login functionality
- [ ] Test API endpoints
- [ ] Update frontend API URL

---

## 🔗 Your Deployment URLs

After deployment, you'll have:

- **Frontend:** `https://your-frontend-url.onrender.com`
- **Backend API:** `https://your-backend-url.onrender.com`
- **API Health:** `https://your-backend-url.onrender.com/api/health`

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` or individual DB credentials
- Check SSL settings (`ssl: { rejectUnauthorized: false }`)
- Ensure database is accessible from your service

### CORS Errors
- Update `CORS_ORIGIN` to match your frontend URL
- Check for trailing slashes

### Build Failures
- Check build logs in hosting dashboard
- Verify all dependencies in `package.json`
- Ensure Node.js version is compatible

### Static Files Not Serving
- Verify `client/build` directory exists
- Check that build command runs successfully
- Verify static file serving configuration in `server/index.js`

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**🎓 Good luck with your capstone presentation!**

