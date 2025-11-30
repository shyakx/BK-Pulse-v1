# Render Deployment Guide - Free Tier Setup

## 📋 Setup Order (IMPORTANT!)

**Do this FIRST before setting up the Web Service:**
1. ✅ Create PostgreSQL Database on Render (get credentials)
2. ✅ Create Web Service on Render (use database credentials)

---

## 🗄️ STEP 1: Create PostgreSQL Database (Do This First!)

### Why First?
You need the database credentials **before** you can configure your web service environment variables.

### Step-by-Step:

1. **In Render Dashboard:**
   - Click **"+ New"** button (top right)
   - Select **"PostgreSQL"**

2. **Database Configuration:**
   - **Name**: `bk-pulse-db` (or any name you prefer)
   - **Database**: `bk_pulse` (or leave default)
   - **User**: `bk_pulse_user` (or leave default - Render will auto-generate)
   - **Region**: `Oregon (US West)` (or your preferred region)
   - **PostgreSQL Version**: Latest (default)
   - **Plan**: Select **"Free"** ($0/month)
     - 90 days retention
     - 1 GB storage

3. **Click "Create Database"**

4. **Wait for Database to be Ready** (takes 1-2 minutes)

5. **Get Your Database Credentials:**
   
   Once created, Render will show you:
   
   **Option A: Internal Database URL (Recommended for Render services)**
   ```
   postgresql://bk_pulse_user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/bk_pulse_xxxx
   ```
   - This is the **Internal Database URL** (for services in same region)
   - Copy this entire URL - you'll use it as `DATABASE_URL`
   
   **Option B: Individual Credentials (if you need them separately)**
   - Scroll down to see connection details
   - You'll see:
     - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
     - **Port**: `5432`
     - **Database**: `bk_pulse_xxxx`
     - **User**: `bk_pulse_user`
     - **Password**: (shown once - copy it immediately!)

### ✅ Save These Credentials!

Copy and save these values - you'll need them in the next step:
- Internal Database URL (or individual credentials)
- Password (only shown once!)

---

## 🚀 STEP 2: Create Web Service (Backend API)

### Step 1: Basic Configuration

1. **In Render Dashboard:**
   - Click **"+ New"** → **"Web Service"**
   - Connect your GitHub repository: `shyakx / BK-Pulse-v1`

2. **Service Settings:**
   - **Name**: `bk-pulse-api` (or `BK-Pulse-v1`)
   - **Region**: `Oregon (US West)` (same as database!)
   - **Branch**: `main` ✅
   - **Root Directory**: `server` ⚠️ **CRITICAL** - Set this to `server`

### Step 2: Build & Start Commands

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node index.js
```

### Step 3: Environment Variables

**Now use the database credentials you got from Step 1:**

#### Option A: Using DATABASE_URL (Easiest - Recommended)

Add this single environment variable:
```
DATABASE_URL=postgresql://bk_pulse_user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/bk_pulse_xxxx
```

**Replace with your actual Internal Database URL from Step 1!**

#### Option B: Using Individual Variables

If you prefer individual variables, use the values from Step 1:
```
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bk_pulse_xxxx
DB_USER=bk_pulse_user
DB_PASSWORD=your_actual_password_from_step_1
```

**Replace with your actual values from Step 1!**

#### JWT Configuration
```
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_for_security
JWT_EXPIRE=7d
```

#### Server Configuration
```
PORT=10000
NODE_ENV=production
```

#### CORS Configuration
```
CORS_ORIGIN=https://your-frontend-url.vercel.app,https://bk-pulse-v2.vercel.app
```

**Note**: Replace `your-frontend-url.vercel.app` with your actual frontend URL.

### Step 4: Instance Type

Select: **Free** ($0/month)
- 512 MB RAM
- 0.1 CPU
- ⚠️ Note: Free instances spin down after inactivity (takes ~30 seconds to wake up)

### Step 5: Deploy

Click **"Deploy Web Service"** button at the bottom.

---

## 📝 Where to Find Database Credentials in Render

After creating your PostgreSQL database:

1. **Go to your database dashboard** in Render
2. **Look for "Connections" section** or "Connection Info"
3. **You'll see:**

   **Internal Database URL** (for Render services):
   ```
   postgresql://user:password@host:port/database
   ```
   - Use this as `DATABASE_URL` in your web service
   - This is the easiest option!

   **OR individual values:**
   - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `bk_pulse_xxxx`
   - **User**: `bk_pulse_user`
   - **Password**: (shown in the connection string)

4. **Copy the Internal Database URL** - this is what you'll use!

---

## 📋 Complete Environment Variables List

**After you create the PostgreSQL database (Step 1), copy these into your Web Service:**

### Required Environment Variables:

```env
# Database - GET THIS FROM YOUR POSTGRESQL DATABASE (Step 1)
# Option 1: Use Internal Database URL (Easiest)
DATABASE_URL=postgresql://bk_pulse_user:YOUR_PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com:5432/bk_pulse_xxxx

# Option 2: Use Individual Variables (if not using DATABASE_URL)
# DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
# DB_PORT=5432
# DB_NAME=bk_pulse_xxxx
# DB_USER=bk_pulse_user
# DB_PASSWORD=YOUR_PASSWORD_FROM_STEP_1

# JWT Secret - Generate a random 32+ character string
# You can use: openssl rand -base64 32 (in terminal) or any random string generator
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_for_security_12345

# JWT Expiration
JWT_EXPIRE=7d

# Server Port (Render sets this automatically, but include it)
PORT=10000

# Environment
NODE_ENV=production

# CORS - Add your frontend URL(s)
# Replace with your actual Vercel frontend URL
CORS_ORIGIN=https://bk-pulse-v2.vercel.app
```

### How to Generate JWT_SECRET:

**Option 1: Using PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Option 2: Using Online Generator:**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" - copy a 32+ character string

**Option 3: Use any random string:**
- Minimum 32 characters
- Mix of letters, numbers, and symbols

---

## 🔧 Important Notes for Free Tier

### Limitations:
1. **Cold Starts**: Free instances spin down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.
2. **No SSH Access**: Free tier doesn't support SSH
3. **No Scaling**: Can't scale horizontally
4. **No Persistent Disks**: Use database for storage

### Recommendations:
1. **Keep-alive**: Consider a cron job or uptime monitor to ping your service every 10-15 minutes
2. **Database**: Use Render's PostgreSQL (free tier available)
3. **Frontend**: Deploy separately on Vercel (free tier)

---

## ✅ After Deployment

1. **Check Health**: Visit `https://your-service.onrender.com/api/health`
2. **Test API**: Try `https://your-service.onrender.com/api/auth/login`
3. **Update Frontend**: Update your frontend's API URL to point to Render service

---

## 🐛 Troubleshooting

### Service won't start:
- Check build logs in Render dashboard
- Verify all environment variables are set
- Check that `Root Directory` is set to `server`

### Database connection errors:
- Verify `DATABASE_URL` or database credentials are correct
- Check that database is in the same region
- Ensure database is created and running

### CORS errors:
- Add your frontend URL to `CORS_ORIGIN`
- Check that `NODE_ENV=production` is set

---

## 📝 Quick Setup Checklist

### Step 1: Database Setup
- [ ] Go to Render Dashboard
- [ ] Click "+ New" → "PostgreSQL"
- [ ] Name: `bk-pulse-db`
- [ ] Region: `Oregon (US West)`
- [ ] Plan: **Free**
- [ ] Click "Create Database"
- [ ] Wait for database to be ready (1-2 minutes)
- [ ] **Copy the Internal Database URL** (save it!)

### Step 2: Web Service Setup
- [ ] Click "+ New" → "Web Service"
- [ ] Connect GitHub: `shyakx / BK-Pulse-v1`
- [ ] Name: `bk-pulse-api`
- [ ] Region: `Oregon (US West)` (same as database!)
- [ ] Branch: `main`
- [ ] **Root Directory: `server`** ⚠️ CRITICAL
- [ ] Build Command: `npm install`
- [ ] Start Command: `node index.js`
- [ ] Add environment variables (use database URL from Step 1)
- [ ] Instance Type: **Free**
- [ ] Click "Deploy Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Test: `https://your-service.onrender.com/api/health`
- [ ] Update frontend API URL to point to Render service

