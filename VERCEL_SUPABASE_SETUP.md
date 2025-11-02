# 🚀 Vercel + Supabase Setup Guide

**Best Performance Combo for BK-PULSE**

This combination gives you:
- ✅ **Vercel**: World-class frontend hosting with global CDN
- ✅ **Supabase**: Free PostgreSQL database + additional features
- ✅ Always-on services (no sleep)
- ✅ Excellent for production and demos

---

## 🎯 Why Vercel + Supabase?

### Vercel Benefits:
- ⚡ **Lightning fast** - Global CDN distribution
- 🔄 **Auto-deployments** from GitHub
- 🆓 **Free tier** - Generous limits for academic projects
- 📦 **Optimized builds** - Built for React apps
- 🔒 **Free SSL** certificates
- 📊 **Analytics** included

### Supabase Benefits:
- 🗄️ **PostgreSQL** database (up to 500 MB free)
- 🔐 **Built-in auth** (optional, you're using JWT)
- 🗃️ **Database dashboard** - Visual SQL editor
- 📈 **Real-time subscriptions** (optional)
- 🔒 **Row-level security** (optional)
- 🆓 **Free tier** - Perfect for academic projects

---

## 📋 Step-by-Step Setup

### Prerequisites
- GitHub account
- Code pushed to GitHub (already done: `shyakx/BK-Pulse-v1`)

---

## Step 1: Create Supabase Database (5 minutes)

### 1.1 Sign Up for Supabase

1. Go to [Supabase](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with **GitHub** (recommended) or email
4. Verify your email if needed

### 1.2 Create New Project

1. Click **"New Project"**
2. Fill in details:
   - **Name:** `bk-pulse`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you (e.g., `US East`, `EU West`)
   - **Pricing Plan:** Free (should be selected by default)
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be created

### 1.3 Get Database Connection String

1. Once project is ready, go to **Settings** → **Database**
2. Scroll down to **"Connection string"**
3. Copy the **"URI"** connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with the password you created
4. **Save this connection string** - you'll need it for Railway/Vercel backend

---

## Step 2: Deploy Backend to Railway (Recommended)

Since Vercel is optimized for frontend, we'll deploy the backend to **Railway** (or Fly.io) which is better for Node.js APIs.

### Option A: Railway (Easiest)

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `shyakx/BK-Pulse-v1`
5. Click **"+ New"** → **"Empty Service"**
6. Configure:
   - **Settings:**
     - Root Directory: `server`
     - Start Command: `node index.js`
   - **Variables:**
     ```
     DATABASE_URL=<paste_supabase_connection_string>
     JWT_SECRET=your_random_secret_key_here
     JWT_EXPIRE=7d
     NODE_ENV=production
     PORT=3000
     CORS_ORIGIN=https://your-frontend-url.vercel.app
     ```
7. Railway will deploy automatically

### Option B: Fly.io (Alternative)

```bash
# Install Fly CLI (if not installed)
iwr https://fly.io/install.ps1 -useb | iex

# Login
flyctl auth login

# Create app
cd server
flyctl launch --name bk-pulse-backend

# Set secrets
flyctl secrets set DATABASE_URL=<supabase_connection_string>
flyctl secrets set JWT_SECRET=<your_secret>
flyctl secrets set JWT_EXPIRE=7d
flyctl secrets set NODE_ENV=production
flyctl secrets set CORS_ORIGIN=https://your-frontend.vercel.app

# Deploy
flyctl deploy
```

---

## Step 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Connect Repository to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up with **GitHub** (one-click authorization)
3. Click **"Add New..."** → **"Project"**
4. Import your repository: `shyakx/BK-Pulse-v1`

### 3.2 Configure Project Settings

Vercel will detect it's a React app. Configure:

**Build Settings:**
- **Framework Preset:** Create React App (auto-detected)
- **Root Directory:** `client` (important!)
- **Build Command:** `npm run build` (or leave default)
- **Output Directory:** `build` (or leave default)

**Environment Variables:**
Click **"Environment Variables"** and add:
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```
(Replace with your actual backend URL from Railway/Fly.io)

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will provide you with a URL like: `https://bk-pulse-v1.vercel.app`

---

## Step 4: Update CORS in Backend

1. Go to your Railway/Fly.io backend service
2. Update the `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
3. Service will automatically redeploy

---

## Step 5: Initialize Database in Supabase

### 5.1 Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste the contents of `server/sql/schema.sql`
5. Click **"Run"** (or press Ctrl+Enter)
6. Verify tables were created by checking **"Table Editor"**

### 5.2 Seed Initial Data (Optional)

1. In SQL Editor, click **"New query"**
2. Copy and paste contents of `server/sql/seed.sql`
3. Click **"Run"**
4. Verify data in **"Table Editor"**

---

## Step 6: Verify Everything Works

1. **Test Frontend:** Visit your Vercel URL
2. **Test Login:** Use default credentials (e.g., `admin@bk.rw` / `password123`)
3. **Test API:** Check that dashboard loads and shows data
4. **Test Database:** Check Supabase dashboard → Table Editor to see your data

---

## 📊 Your Deployment URLs

After setup, you'll have:

- **Frontend (Vercel):** `https://bk-pulse-v1.vercel.app`
- **Backend (Railway/Fly.io):** `https://bk-pulse-backend.railway.app`
- **Database (Supabase):** Managed via Supabase dashboard

---

## 🔧 Advanced Configuration

### Custom Domain on Vercel

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL is automatic!

### Supabase Database Settings

- **Connection Pooling:** For better performance, use connection pooling
  - Go to Settings → Database → Connection Pooling
  - Use the connection pooler URL instead of direct connection
- **Backups:** Free tier includes daily backups
- **Extensions:** Enable PostgreSQL extensions if needed

### Environment Variables

**Frontend (Vercel):**
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

**Backend (Railway/Fly.io):**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 🆘 Troubleshooting

### Database Connection Issues

**Problem:** Backend can't connect to Supabase
**Solution:**
1. Verify connection string includes password
2. Replace `[YOUR-PASSWORD]` in connection string
3. Check Supabase project is active (not paused)
4. Use connection pooler URL if available

### CORS Errors

**Problem:** Frontend can't call backend API
**Solution:**
1. Verify `CORS_ORIGIN` in backend matches frontend URL exactly
2. Include protocol (`https://`)
3. No trailing slash
4. Redeploy backend after updating

### Build Failures

**Problem:** Vercel build fails
**Solution:**
1. Check build logs in Vercel dashboard
2. Verify Root Directory is set to `client`
3. Ensure all dependencies are in `package.json`
4. Check for environment variable errors

### Environment Variables Not Working

**Problem:** Frontend can't access API
**Solution:**
1. Vercel environment variables must start with `REACT_APP_`
2. Redeploy after adding/changing variables
3. Check variable names match exactly (case-sensitive)

---

## 💡 Tips for Academic Presentations

1. **Test Before Demo:** Always test the live deployment before presenting
2. **Use Custom Domain:** Adds professionalism (optional, but nice)
3. **Monitor Usage:** Check Supabase and Vercel dashboards for usage
4. **Backup Strategy:** Export database regularly from Supabase
5. **Document URLs:** Save your deployment URLs for easy access

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/overview)

---

## ✅ Advantages of This Setup

- **Performance:** Vercel's CDN makes frontend super fast globally
- **Database:** Supabase provides excellent database management tools
- **Scalability:** Easy to scale both frontend and backend independently
- **Developer Experience:** Great dashboards for monitoring and debugging
- **Free Tier:** Generous free limits for academic projects
- **Production Ready:** Both services are used by thousands of production apps

---

**🎓 Perfect for your academic capstone! This combo gives you production-quality hosting for free!**

