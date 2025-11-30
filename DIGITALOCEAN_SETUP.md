# DigitalOcean App Platform Setup Guide

## 🌊 Why DigitalOcean?

- **No limit on free databases** (unlike Render's 1 free database limit)
- **Better free tier options** for development
- **More flexible** pricing and scaling
- **SSH access** even on basic plans

---

## 📋 Setup Overview

DigitalOcean App Platform is similar to Render - it automatically builds and deploys from your GitHub repo.

### What You'll Need:
1. DigitalOcean account (sign up at https://www.digitalocean.com)
2. GitHub repository connected
3. PostgreSQL database (Managed Database - free tier available)

---

## 🗄️ STEP 1: Create PostgreSQL Database

### Option A: Managed Database (Recommended - Free Tier Available)

1. **Go to DigitalOcean Dashboard**
2. **Click "Create" → "Databases"**
3. **Select PostgreSQL**
4. **Configuration:**
   - **Datacenter Region**: Choose closest to you (e.g., `NYC1`, `SFO3`, `AMS3`)
   - **Database Engine**: PostgreSQL (latest version)
   - **Plan**: 
     - **Basic** → **$15/month** (1 GB RAM, 1 vCPU, 10 GB storage)
     - **OR Development** → **$12/month** (1 GB RAM, 1 vCPU, 10 GB storage)
     - ⚠️ Note: DigitalOcean doesn't have a completely free database tier, but App Platform has a free tier for apps

### Option B: Use App Platform's Built-in Database (Easier)

When creating your App, you can add a PostgreSQL database component directly - this is often easier!

---

## 🚀 STEP 2: Create App on App Platform

### Step 1: Connect Your Repository

1. **Go to DigitalOcean Dashboard**
2. **Click "Create" → "Apps"**
3. **Connect GitHub**:
   - Click "GitHub" button
   - Authorize DigitalOcean
   - Select repository: `shyakx/BK-Pulse-v1`
   - Select branch: `main`
   - Click "Next"

### Step 2: Configure Your App

#### Basic Settings:
- **Name**: `bk-pulse-api` (or any name)
- **Region**: Choose closest to you
- **Resource Type**: **Basic** (Free tier available for apps!)

#### Build & Run Settings:

**Source Directory**: Leave empty (or set to `server` if needed)

**Build Command:**
```bash
cd server && npm install
```

**Run Command:**
```bash
cd server && node index.js
```

**OR if you set Source Directory to `server`:**

**Build Command:**
```bash
npm install
```

**Run Command:**
```bash
node index.js
```

### Step 3: Add Environment Variables

Click "Edit" next to "Environment Variables" and add:

```env
# Database - You'll get this after creating the database
DATABASE_URL=postgresql://doadmin:password@host:25060/defaultdb?sslmode=require

# OR use individual variables:
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your_password
DB_SSL=true

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_12345
JWT_EXPIRE=7d

# Server
PORT=8080
NODE_ENV=production

# CORS - Add your frontend URL
CORS_ORIGIN=https://bk-pulse-v2.vercel.app
```

### Step 4: Add Database Component

1. **Click "Add Resource" → "Database"**
2. **Select PostgreSQL**
3. **Choose Plan**:
   - **Basic** ($15/month) - Recommended for production
   - **Development** ($12/month) - For testing
4. **Database Name**: `bk_pulse`
5. **Version**: Latest PostgreSQL
6. **Region**: Same as your app

**DigitalOcean will automatically:**
- Create the database
- Set up connection string
- Add `DATABASE_URL` environment variable to your app automatically!

### Step 5: Choose Plan

**For Free Tier:**
- Select **"Basic"** plan
- **Free tier includes**: 
  - 3 Static Sites
  - 2 Basic Apps (512 MB RAM, shared CPU)
  - ⚠️ Note: Database is separate ($12-15/month minimum)

**For Development:**
- **Basic App**: $5/month (512 MB RAM, shared CPU)
- **Database**: $12/month (Development plan)
- **Total**: ~$17/month

### Step 6: Deploy

1. **Review your configuration**
2. **Click "Create Resources"**
3. **Wait for deployment** (5-10 minutes)
4. **Your app will be live at**: `https://your-app-name.ondigitalocean.app`

---

## 🔧 Alternative: DigitalOcean Droplet (VPS - More Control)

If you want more control and potentially lower costs, you can use a Droplet:

### Droplet Setup (VPS):

1. **Create Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: **Basic** → **Regular Intel** → **$4/month** (512 MB RAM) or **$6/month** (1 GB RAM)
   - **Region**: Choose closest
   - **Authentication**: SSH keys (recommended) or password
   - **Click "Create Droplet"**

2. **SSH into Droplet**:
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PostgreSQL**:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

5. **Set up Database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE bk_pulse;
   CREATE USER bk_pulse_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bk_pulse TO bk_pulse_user;
   \q
   ```

6. **Clone and Deploy Your App**:
   ```bash
   git clone https://github.com/shyakx/BK-Pulse-v1.git
   cd BK-Pulse-v1/server
   npm install
   ```

7. **Set up Environment Variables**:
   ```bash
   nano .env
   # Add your environment variables
   ```

8. **Use PM2 to Run App**:
   ```bash
   npm install -g pm2
   cd /root/BK-Pulse-v1/server
   pm2 start index.js --name bk-pulse
   pm2 save
   pm2 startup
   ```

9. **Set up Nginx Reverse Proxy** (optional but recommended):
   ```bash
   sudo apt install nginx
   # Configure nginx to proxy to your app
   ```

---

## 📊 Cost Comparison

### Render (Free Tier):
- **App**: Free (spins down after inactivity)
- **Database**: Free (1 database limit) ❌ You hit this limit
- **Total**: $0/month (but limited)

### DigitalOcean App Platform:
- **App**: Free (Basic plan) or $5/month
- **Database**: $12-15/month (no free tier, but no limit)
- **Total**: $12-20/month

### DigitalOcean Droplet (VPS):
- **Droplet**: $4-6/month
- **Database**: Included (self-hosted PostgreSQL)
- **Total**: $4-6/month (cheapest, but requires more setup)

---

## 🎯 Recommended Setup for You

**Since you want free tier and hit Render's database limit:**

### Option 1: DigitalOcean App Platform + Managed Database
- **App**: Free tier (Basic plan)
- **Database**: $12/month (Development plan)
- **Pros**: Easy setup, automatic deployments
- **Cons**: Database costs $12/month

### Option 2: DigitalOcean Droplet (VPS)
- **Droplet**: $4-6/month
- **Database**: Free (self-hosted)
- **Pros**: Cheapest, full control
- **Cons**: More setup required, you manage everything

### Option 3: Hybrid Approach
- **App**: Deploy on DigitalOcean App Platform (Free)
- **Database**: Use external free PostgreSQL (like Supabase, Neon, or ElephantSQL)
- **Total**: $0/month! ✅

---

## 🆓 Free Database Alternatives

If you want to keep costs at $0, use a free PostgreSQL service:

### Option A: Supabase (Recommended)
- **Free Tier**: 500 MB database, unlimited API requests
- **Setup**: 
  1. Go to https://supabase.com
  2. Create account
  3. Create new project
  4. Get connection string from Settings → Database
  5. Use as `DATABASE_URL` in DigitalOcean

### Option B: Neon
- **Free Tier**: 3 GB database
- **Setup**: Similar to Supabase

### Option C: ElephantSQL
- **Free Tier**: 20 MB database (small but free)
- **Good for**: Testing/development

---

## 📝 Quick Setup Checklist (App Platform + Free Database)

### Step 1: Get Free Database
- [ ] Sign up for Supabase (or Neon/ElephantSQL)
- [ ] Create new project
- [ ] Copy connection string (Settings → Database)

### Step 2: Create App on DigitalOcean
- [ ] Go to DigitalOcean → Create → Apps
- [ ] Connect GitHub: `shyakx/BK-Pulse-v1`
- [ ] Branch: `main`
- [ ] Source Directory: `server` (or leave empty and use `cd server` in commands)
- [ ] Build Command: `cd server && npm install` (or `npm install` if source dir is `server`)
- [ ] Run Command: `cd server && node index.js` (or `node index.js` if source dir is `server`)
- [ ] Add Environment Variables:
  - [ ] `DATABASE_URL` (from Supabase/Neon)
  - [ ] `JWT_SECRET` (generate random 32+ char string)
  - [ ] `JWT_EXPIRE=7d`
  - [ ] `PORT=8080`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN=https://bk-pulse-v2.vercel.app`
- [ ] Plan: **Basic** (Free tier)
- [ ] Click "Create Resources"
- [ ] Wait for deployment

### Step 3: Test
- [ ] Visit: `https://your-app.ondigitalocean.app/api/health`
- [ ] Should return: `{"status":"OK",...}`

---

## 🔑 Generate JWT_SECRET

**PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Or use online generator:**
- https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" - copy a 32+ character string

---

## 🐛 Troubleshooting

### App won't start:
- Check build logs in DigitalOcean dashboard
- Verify Source Directory is set correctly
- Check that all environment variables are set

### Database connection errors:
- Verify `DATABASE_URL` is correct
- Check SSL mode (Supabase/Neon require SSL)
- Ensure database is accessible from internet

### CORS errors:
- Add your frontend URL to `CORS_ORIGIN`
- Check that `NODE_ENV=production` is set

---

## 💡 Pro Tips

1. **Use Supabase for free database** - Best free tier (500 MB)
2. **Set up automatic deployments** - DigitalOcean auto-deploys on git push
3. **Monitor your app** - Use DigitalOcean's built-in monitoring
4. **Set up alerts** - Get notified if app goes down

---

## 📚 Additional Resources

- **DigitalOcean App Platform Docs**: https://docs.digitalocean.com/products/app-platform/
- **Supabase Setup**: https://supabase.com/docs/guides/database
- **Neon Setup**: https://neon.tech/docs

