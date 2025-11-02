# 🚀 BK-PULSE Deployment Guide

**Academic Capstone Project - Simple Deployment**

---

## 📋 Pre-Deployment Checklist

- [x] Database schema created and populated
- [x] Environment variables configured
- [x] ML model files present (`data/models/gradient_boosting_best.pkl`)
- [x] All dependencies installed
- [x] Code cleaned and tested

---

## 🖥️ Option 1: Local Deployment (For Demo/Presentation)

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- Python 3.8+ (for ML predictions)
- npm or yarn

### Steps

#### 1. **Prepare Environment**

```bash
# Clone/navigate to project
cd BK-PULSE

# Install all dependencies
npm run install-all

# Install Python dependencies
cd ml
pip install -r requirements.txt
cd ..
```

#### 2. **Setup Database**

```bash
# Create database
createdb bk_pulse

# Run schema (if not done already)
psql -d bk_pulse -f server/sql/schema.sql

# Seed initial data (if needed)
psql -d bk_pulse -f server/sql/seed.sql
```

#### 3. **Configure Environment Variables**

Create `server/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bk_pulse
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### 4. **Build Frontend**

```bash
# Build React app for production
npm run build

# This creates optimized files in client/build/
```

#### 5. **Configure Server to Serve Static Files**

Update `server/index.js` to serve the React build:

```javascript
// Serve static files from React app
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));

// API routes (before static files)
// ... existing routes ...

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
```

#### 6. **Start Application**

```bash
# Start server (serves both API and frontend)
npm start

# Or if you want to run separately:
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend (dev mode)
cd client && npm start
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

---

## 🌐 Option 2: Simple Cloud Deployment

### For Academic Capstone - Recommended Platforms:

#### **A. Vercel (Frontend) + Railway/Render (Backend + DB)**

**Frontend (Vercel):**
1. Push code to GitHub
2. Import project to Vercel
3. Build command: `cd client && npm install && npm run build`
4. Output directory: `client/build`
5. Environment variables: `REACT_APP_API_URL=https://your-backend.railway.app`

**Backend (Railway/Render):**
1. Create new service on Railway/Render
2. Connect GitHub repo
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add PostgreSQL database
7. Set environment variables

---

#### **B. Heroku (Full Stack - Simple)**

**1. Install Heroku CLI**
```bash
# Install from https://devcenter.heroku.com/articles/heroku-cli
```

**2. Create Heroku App**
```bash
heroku create bk-pulse-app
heroku addons:create heroku-postgresql:hobby-dev
```

**3. Configure Environment Variables**
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
```

**4. Deploy**
```bash
# Make sure you're in project root
git add .
git commit -m "Prepare for deployment"
git push heroku main
```

**5. Run Database Setup**
```bash
heroku run node server/setup-db.js
heroku run psql $DATABASE_URL -f server/sql/schema.sql
```

**Note:** For Heroku, you'll need to:
- Update `server/index.js` to serve static files (as shown in Option 1)
- Ensure Python buildpack is added for ML predictions

---

#### **C. Render (Free Tier Friendly)**

**1. Create Web Service**
- Connect GitHub repository
- Build command: `cd server && npm install`
- Start command: `cd server && npm start`
- Add PostgreSQL database

**2. Create Static Site (Frontend)**
- Build command: `cd client && npm install && npm run build`
- Publish directory: `client/build`

**3. Set Environment Variables**
- Same as local deployment

---

## 📦 Build Scripts

### Production Build

```bash
# From project root
npm run build              # Builds React frontend
npm start                  # Starts production server
```

### Verify Build

```bash
# Check build output
ls -la client/build/

# Test production build locally
cd server
NODE_ENV=production npm start
```

---

## 🔧 Production Configuration

### Update Server Index (Serve Static Files)

Add to `server/index.js` after routes but before 404 handler:

```javascript
// Serve static files from React app (in production)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}
```

### Update Client API Configuration

Update `client/src/services/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

Then set `REACT_APP_API_URL` in your deployment environment.

---

## 🐍 Python ML Requirements

For ML predictions to work in production:

1. **Ensure Python is available:**
   - Heroku: Add Python buildpack
   - Railway/Render: Usually available by default

2. **Install Python dependencies:**
   ```bash
   pip install -r ml/requirements.txt
   ```

3. **Verify model files exist:**
   - `data/models/gradient_boosting_best.pkl`
   - `data/processed/scaler.pkl`
   - `data/processed/encoders.pkl`

---

## ✅ Post-Deployment Verification

### 1. **Health Check**
```bash
curl https://your-api-url.com/api/health
```

### 2. **Test Authentication**
- Login with default credentials
- Verify JWT token generation

### 3. **Test ML Predictions**
- Go to customer details
- Click "Update Prediction"
- Verify prediction completes

### 4. **Check Database**
```bash
# Connect to production DB
psql $DATABASE_URL

# Verify tables
\dt

# Check customer count
SELECT COUNT(*) FROM customers;
```

---

## 🎯 Quick Deploy Checklist

- [ ] Code committed to Git
- [ ] `.env` file configured (don't commit it!)
- [ ] Frontend built successfully
- [ ] Database schema applied
- [ ] ML model files present
- [ ] Environment variables set
- [ ] CORS origin configured correctly
- [ ] Health check endpoint working
- [ ] Can login and view dashboard

---

## 📝 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Retention Officer | officer1@bk.rw | password123 |
| Retention Analyst | analyst1@bk.rw | password123 |
| Retention Manager | manager1@bk.rw | password123 |
| Admin | admin@bk.rw | password123 |

**⚠️ Change these in production!**

---

## 🚨 Common Issues & Solutions

### Issue: ML predictions fail
**Solution:** 
- Verify Python is installed
- Check model files exist
- Verify Python dependencies installed

### Issue: CORS errors
**Solution:**
- Update `CORS_ORIGIN` in environment variables
- Include protocol (http:// or https://)

### Issue: Database connection fails
**Solution:**
- Verify database credentials
- Check database URL format
- Ensure database exists

### Issue: Static files not loading
**Solution:**
- Verify build completed successfully
- Check static file serving in `server/index.js`
- Verify file paths are correct

---

## 📚 Additional Resources

- **README.md** - Project overview
- **USER_GUIDE.md** - User documentation
- **PROJECT_STATUS.md** - Development status
- **POST_SEEDING_GUIDE.md** - Database setup guide

---

## 🎓 Academic Presentation Tips

1. **Demo Environment:**
   - Use local deployment for reliability
   - Have backup screenshots/videos
   - Test all features before presentation

2. **Key Features to Highlight:**
   - Dashboard with 170K customers
   - ML predictions working
   - Role-based access control
   - Real-time analytics

3. **Demo Flow:**
   - Login as different roles
   - Show dashboard with real data
   - Demonstrate prediction updates
   - Show customer management features

---

**Good luck with your capstone presentation! 🎉**

*Last Updated: November 2, 2025*

