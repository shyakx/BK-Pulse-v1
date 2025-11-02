# ✅ BK-PULSE Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Setup ✅
- [ ] Node.js installed (v16+)
- [ ] PostgreSQL installed and running
- [ ] Python 3.8+ installed (for ML predictions)
- [ ] Git repository ready

### 2. Database Setup ✅
- [ ] PostgreSQL database created: `bk_pulse`
- [ ] Schema applied: `server/sql/schema.sql`
- [ ] Seed data loaded (if needed): `server/sql/seed.sql`
- [ ] 170,000 customers verified (or your target amount)
- [ ] Database indexes verified

### 3. Configuration ✅
- [ ] `server/.env` file created from `server/env.example`
- [ ] Database credentials configured
- [ ] JWT_SECRET set (change from default!)
- [ ] CORS_ORIGIN configured
- [ ] PORT configured (default: 5000)

### 4. Dependencies ✅
- [ ] All npm packages installed: `npm run install-all`
- [ ] Python ML dependencies: `pip install -r ml/requirements.txt`
- [ ] No dependency errors

### 5. ML Model Files ✅
- [ ] Model file exists: `data/models/gradient_boosting_best.pkl`
- [ ] Scaler exists: `data/processed/scaler.pkl`
- [ ] Encoders exist: `data/processed/encoders.pkl`
- [ ] Model tested: `python ml/predict.py` works

### 6. Code Quality ✅
- [ ] Code cleaned (console.logs reviewed)
- [ ] No syntax errors
- [ ] All routes tested
- [ ] Frontend builds successfully

---

## Deployment Steps

### Option A: Local Deployment (Recommended for Demo)

```bash
# 1. Install dependencies
npm run install-all

# 2. Build frontend
npm run build

# 3. Start production server
npm start

# Or use the deployment script
# Windows: deploy.bat
# Linux/Mac: ./deploy.sh
```

**Access:**
- Application: http://localhost:5000
- API Health: http://localhost:5000/api/health

---

### Option B: Cloud Deployment

**Platform Options:**
1. **Railway** (Recommended - Easy PostgreSQL setup)
2. **Render** (Free tier available)
3. **Heroku** (If you have account)
4. **Vercel** (Frontend) + **Railway** (Backend)

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK",...}
```

### 2. Test Login
- [ ] Can login with default credentials
- [ ] JWT token received
- [ ] Dashboard loads

### 3. Test Features
- [ ] Dashboard shows real data (170K customers)
- [ ] Customer list loads
- [ ] Can view customer details
- [ ] ML prediction works (click "Update Prediction")
- [ ] Tasks load correctly
- [ ] All role permissions work

### 4. Test ML Predictions
- [ ] Single prediction works
- [ ] Batch prediction works (small batch first)
- [ ] No timeout errors

---

## Quick Test Commands

```bash
# Test database connection
cd server
node -e "const pool = require('./config/database'); pool.query('SELECT COUNT(*) FROM customers').then(r => console.log('Customers:', r.rows[0].count)).catch(e => console.error('Error:', e));"

# Test ML prediction
python ml/predict.py "{\"customer_data\":{\"Age\":35,\"Tenure_Months\":24,\"Customer_Segment\":\"Retail\"}}"

# Test API
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### Build Fails
- Check Node.js version: `node --version` (should be 16+)
- Clear cache: `npm cache clean --force`
- Delete node_modules and reinstall

### Database Connection Fails
- Verify PostgreSQL is running
- Check `.env` file credentials
- Test connection: `psql -U postgres -d bk_pulse`

### ML Predictions Fail
- Verify Python installed: `python --version`
- Check model files exist
- Test: `python ml/predict.py` with sample data

### Port Already in Use
- Change PORT in `.env`
- Or kill process using port 5000

---

## Default Credentials

⚠️ **Change these in production!**

| Role | Email | Password |
|------|-------|----------|
| Retention Officer | officer1@bk.rw | password123 |
| Retention Analyst | analyst1@bk.rw | password123 |
| Retention Manager | manager1@bk.rw | password123 |
| Admin | admin@bk.rw | password123 |

---

## Files Created for Deployment

✅ `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
✅ `DEPLOYMENT_CHECKLIST.md` - This file
✅ `deploy.sh` - Linux/Mac deployment script
✅ `deploy.bat` - Windows deployment script
✅ `start-production.bat` - Windows production start script
✅ `CLEANUP_SUMMARY.md` - Cleanup documentation

---

## Ready to Deploy! 🚀

Follow the steps above and you'll be ready for your capstone presentation!

*Last Updated: November 2, 2025*

