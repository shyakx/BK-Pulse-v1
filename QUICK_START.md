# ⚡ BK-PULSE Quick Start Guide

## 🚀 Fastest Way to Get Running

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Configure Environment
```bash
# Copy example env file
copy server\env.example server\.env

# Edit server\.env with your database credentials
```

### 3. Setup Database
```bash
# Create database
createdb bk_pulse

# Run schema
psql -d bk_pulse -f server/sql/schema.sql

# Seed initial data
psql -d bk_pulse -f server/sql/seed.sql
```

### 4. Build & Start
```bash
# Build frontend
npm run build

# Start server (serves both API and frontend)
npm start
```

**That's it!** 🎉

Access at: **http://localhost:5000**

---

## 🎯 For Demo/Presentation

### Option 1: Development Mode (Easier for demo)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Option 2: Production Mode (Single server)
```bash
npm run build
npm start
```
- Everything: http://localhost:5000

---

## 📝 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Officer** | officer1@bk.rw | password123 |
| **Analyst** | analyst1@bk.rw | password123 |
| **Manager** | manager1@bk.rw | password123 |
| **Admin** | admin@bk.rw | password123 |

---

## ✅ Verify Everything Works

1. **Login** → Dashboard should show 170K customers
2. **View Customers** → Should see customer list
3. **Customer Details** → Click a customer, see details
4. **Update Prediction** → Should work (if ML model is set up)
5. **Tasks** → Should show recent tasks

---

## 🐍 ML Setup (If Predictions Needed)

```bash
# Install Python dependencies
cd ml
pip install -r requirements.txt

# Verify model exists
ls ../data/models/gradient_boosting_best.pkl
```

---

## 🆘 Quick Troubleshooting

**Database error?**
- Check PostgreSQL is running
- Verify `.env` credentials

**Build fails?**
- Try: `npm cache clean --force`
- Then: `npm run install-all`

**Port in use?**
- Change `PORT` in `server/.env`

**ML predictions fail?**
- Check Python is installed: `python --version`
- Verify model files exist

---

## 📚 Full Documentation

- **DEPLOYMENT_GUIDE.md** - Detailed deployment options
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist
- **USER_GUIDE.md** - User documentation
- **README.md** - Project overview

---

**Ready in 5 minutes!** ⚡

