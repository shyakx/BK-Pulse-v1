# 🌐 BK-PULSE Hosting Guide

**Free Hosting Options for Academic Capstone Projects**

---

## 🎯 Recommended Free Hosting Platforms

### Option 1: **Railway** ⭐ (BEST FREE OPTION)
- ✅ **$5 free credit/month** (usually enough for academic projects)
- ✅ Free PostgreSQL database included
- ✅ Easy deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ✅ No sleep time (always-on services)
- ✅ Very intuitive dashboard
- ✅ Perfect for academic capstone projects

### Option 2: **Fly.io** ⭐ (GREAT ALTERNATIVE)
- ✅ **256 MB RAM + 3 GB storage** free tier
- ✅ PostgreSQL database support
- ✅ Global edge deployment
- ✅ Always-on applications
- ✅ Free SSL certificates
- ✅ No credit card required
- ⚠️ Slightly more setup required

### Option 3: **Render**
- ✅ Free PostgreSQL database included
- ✅ Free web service (sleeps after inactivity)
- ✅ Easy deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ⚠️ Services sleep after 15 min inactivity

### Option 4: **Vercel + Supabase**
- ✅ Vercel: Free frontend hosting (best performance)
- ✅ Supabase: Free PostgreSQL database
- ✅ Excellent for production
- ⚠️ Requires two services (frontend + backend)

---

## 🚀 Option 1: Deploy to Railway (BEST FREE OPTION) ⭐

**Why Railway?**
- ✅ $5 free credit/month (perfect for academic projects)
- ✅ No sleep time (always-on services)
- ✅ Very easy setup
- ✅ Automatic PostgreSQL database setup
- ✅ Great for demos and presentations

### Step 1: Create Railway Account

1. Go to [Railway](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (one-click authorization)

### Step 2: Create New Project from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your repositories
4. Select your repository: `shyakx/BK-Pulse-v1`

### Step 3: Add PostgreSQL Database

1. In your project dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates the database
4. **Important:** Railway automatically creates a `DATABASE_URL` environment variable - you'll use this!

### Step 4: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"** again
2. Select the same repository
3. Railway will detect it's a Node.js project
4. Click on the service to configure it
5. Go to **"Settings"** tab:
   - **Root Directory:** `server`
   - **Start Command:** `node index.js`
6. Go to **"Variables"** tab and add:
   ```
   JWT_SECRET=generate_a_random_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   PORT=3000
   ```
   **Note:** `DATABASE_URL` is automatically added from the PostgreSQL service!

7. Railway will automatically deploy!

### Step 5: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** again
2. Select the same repository
3. Go to **"Settings"** tab:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l 3000`
4. Go to **"Variables"** tab and add:
   ```
   REACT_APP_API_URL=https://your-backend-service.up.railway.app/api
   ```
   (Replace with your actual backend URL from Railway)

### Step 6: Get Your URLs

After deployment, Railway provides URLs:
- **Backend:** `https://your-backend-service.up.railway.app`
- **Frontend:** `https://your-frontend-service.up.railway.app`

### Step 7: Update CORS in Backend

1. Go to backend service → **"Variables"** tab
2. Add:
   ```
   CORS_ORIGIN=https://your-frontend-service.up.railway.app
   ```
3. Service will automatically redeploy

### Step 8: Initialize Database

1. Go to your PostgreSQL database service
2. Click **"Connect"** tab
3. Use **"psql"** connection string or Railway's built-in query tool
4. Run your SQL scripts:
   ```sql
   -- Copy and paste contents of server/sql/schema.sql
   -- Then optionally run server/sql/seed.sql
   ```

**OR** use Railway's database query interface to paste SQL directly.

### Step 9: Verify Deployment

1. Visit your frontend URL
2. Test login with default credentials
3. Check that dashboard loads correctly

---

## 🛫 Option 2: Deploy to Fly.io (GREAT ALTERNATIVE) ⭐

**Why Fly.io?**
- ✅ Always-on applications (no sleep)
- ✅ Global edge deployment
- ✅ 256 MB RAM + 3 GB storage free
- ✅ PostgreSQL support
- ✅ No credit card required

### Step 1: Install Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Create Fly.io Account

1. Go to [Fly.io](https://fly.io)
2. Sign up (email or GitHub)
3. No credit card required!

### Step 3: Login to Fly CLI

```bash
flyctl auth login
```

### Step 4: Create PostgreSQL Database

```bash
# Create a Postgres app
flyctl postgres create --name bk-pulse-db --region ord

# Get connection string
flyctl postgres connect -a bk-pulse-db
```

### Step 5: Create Backend App

```bash
# Navigate to server directory
cd server

# Initialize Fly app
flyctl launch --name bk-pulse-backend

# Follow prompts:
# - Select region (choose closest)
# - Don't deploy yet
```

### Step 6: Configure Backend

Create `fly.toml` in `server/` directory:

```toml
app = "bk-pulse-backend"
primary_region = "ord"

[build]

[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true

[env]
  NODE_ENV = "production"
  PORT = "5000"
```

Set secrets:
```bash
flyctl secrets set DATABASE_URL=<your_postgres_connection_string>
flyctl secrets set JWT_SECRET=<your_secret_key>
flyctl secrets set JWT_EXPIRE=7d
flyctl secrets set CORS_ORIGIN=https://bk-pulse-frontend.fly.dev
```

### Step 7: Deploy Backend

```bash
flyctl deploy
```

### Step 8: Deploy Frontend

```bash
# Navigate to client directory
cd ../client

# Initialize Fly app
flyctl launch --name bk-pulse-frontend

# Update fly.toml:
```

```toml
app = "bk-pulse-frontend"
primary_region = "ord"

[build]
  builder = "paketobuildpacks/builder:base"

[http_service]
  internal_port = 8080
  force_https = true

[env]
  REACT_APP_API_URL = "https://bk-pulse-backend.fly.dev/api"
```

Build and deploy:
```bash
npm run build
flyctl deploy --build-arg REACT_APP_API_URL=https://bk-pulse-backend.fly.dev/api
```

---

## 🚀 Option 3: Deploy to Render

### Prerequisites
1. GitHub account
2. Render account (free at https://render.com)
3. Your project pushed to GitHub

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `bk-pulse-db`
   - **Plan:** Free
4. Copy the **Internal Database URL**

### Step 2: Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free
4. Environment Variables:
   ```
   DATABASE_URL=<paste_internal_database_url>
   JWT_SECRET=<generate_random_secret>
   JWT_EXPIRE=7d
   NODE_ENV=production
   PORT=10000
   ```

### Step 3: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
4. Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

### Step 4: Update CORS

Add to backend environment variables:
```
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

---

## 🎨 Option 4: Vercel (Frontend) + Supabase (Database) ⭐ BEST PERFORMANCE

**Perfect combo for production-quality hosting!**

### Quick Overview

- **Frontend:** Deploy to Vercel (best React hosting with CDN)
- **Backend:** Deploy to Railway or Fly.io (better for Node.js APIs)
- **Database:** Use Supabase PostgreSQL (free tier, great dashboard)

### Step 1: Create Supabase Database

1. Go to [Supabase](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - Name: `bk-pulse`
   - Database Password: Create and save a strong password
   - Region: Choose closest to you
   - Plan: Free
4. Wait 2-3 minutes for project creation
5. Go to **Settings** → **Database**
6. Copy the **"URI"** connection string
   - Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Deploy Backend (Railway recommended)

See [Railway Option 1](#-option-1-deploy-to-railway-best-free-option-) above, but use Supabase connection string instead of Railway's database:

**Environment Variables:**
```
DATABASE_URL=<paste_supabase_connection_string>
JWT_SECRET=your_random_secret
JWT_EXPIRE=7d
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import repository: `shyakx/BK-Pulse-v1`
4. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client` ⚠️ Important!
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)
5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```
6. Click **"Deploy"**

### Step 4: Initialize Database

1. Go to Supabase project → **SQL Editor**
2. Click **"New query"**
3. Paste contents of `server/sql/schema.sql`
4. Click **"Run"**
5. Optionally run `server/sql/seed.sql` for initial data

### Step 5: Update CORS

Update backend `CORS_ORIGIN` to your Vercel frontend URL.

**📚 For detailed instructions, see `VERCEL_SUPABASE_SETUP.md`**

---

## 📝 Important Notes

### Database Connection String Format

✅ **Already Configured!** Your `server/config/database.js` already supports `DATABASE_URL` format, so it will work with Railway, Fly.io, Render, and any platform that provides a PostgreSQL connection string.

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

