# ⚡ Quick Hosting Setup (5 Minutes)

## 🚀 Easiest Option: Render.com

### Step 1: Push to GitHub (2 min)

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/bk-pulse.git
git push -u origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render access

### Step 3: Create Database (1 min)
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `bk-pulse-db`
3. Plan: **Free**
4. Click **"Create"**
5. Copy the **Internal Database URL** (you'll need it)

### Step 4: Deploy Backend (1 min)
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `bk-pulse-backend`
   - **Root Directory:** `server`
   - **Build:** `npm install`
   - **Start:** `node index.js`
   - **Plan:** Free
4. Environment Variables:
   ```
   DATABASE_URL=<paste_internal_database_url>
   JWT_SECRET=your_random_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   PORT=10000
   ```
5. Click **"Create Web Service"**

### Step 5: Deploy Frontend (1 min)
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `bk-pulse-frontend`
   - **Root Directory:** `client`
   - **Build:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free
4. Environment Variable:
   ```
   REACT_APP_API_URL=https://bk-pulse-backend.onrender.com/api
   ```
   (Replace with your actual backend URL)
5. Click **"Create Static Site"**

### Step 6: Setup Database
1. Go to your PostgreSQL service
2. Click **"Connect"** tab
3. Use **psql** or **pgAdmin** to connect
4. Run your SQL scripts:
   ```sql
   -- Run schema.sql
   -- Then seed.sql (optional)
   ```

### Step 7: Update CORS
1. Go to backend service
2. **Environment** tab
3. Add/Update:
   ```
   CORS_ORIGIN=https://bk-pulse-frontend.onrender.com
   ```
4. **Manual Deploy** → **Deploy latest commit**

### Done! 🎉
Your app is live at: `https://bk-pulse-frontend.onrender.com`

---

## 🔧 Database Configuration Update

The `server/config/database.js` already supports `DATABASE_URL`, so you're all set!

---

## 📝 Important Notes

1. **First Deploy:** May take 5-10 minutes
2. **Free Tier:** Services sleep after 15 min inactivity (wake up on first request)
3. **Database URL:** Use the **Internal Database URL** from Render (not External)
4. **CORS:** Make sure frontend URL is in backend's `CORS_ORIGIN`

---

## 🆘 Quick Troubleshooting

**Database Connection Failed?**
- Use Internal Database URL, not External
- Check SSL settings are enabled in database config

**CORS Errors?**
- Update `CORS_ORIGIN` in backend to match frontend URL
- Redeploy backend after updating

**Build Failed?**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`

---

**For detailed instructions, see `HOSTING_GUIDE.md`**

