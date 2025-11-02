# 📘 BK Pulse - Complete User Guide

## 🎯 Project Purpose

**BK Pulse** is a **Churn Intelligence Platform** designed for Bank of Kigali to:
- **Predict** which customers are likely to leave (churn)
- **Explain** why customers are at risk using AI-powered insights
- **Recommend** targeted retention actions for each customer
- **Track** retention efforts and measure success
- **Manage** team performance and campaigns

It uses **Machine Learning** to analyze customer data and predict churn probability, then provides actionable insights to help retention teams save customers before they leave.

---

## 🏗️ How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Customers   │  │  Campaigns   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Routes     │  │  ML Predictor│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼────────┐  ┌──────▼──────┐  ┌───────▼───────┐
│   PostgreSQL    │  │ Python ML   │  │ Recommendation│
│    Database     │  │   Model     │  │    Engine     │
└─────────────────┘  └─────────────┘  └───────────────┘
```

### The ML Prediction Flow

1. **Customer Data** → Stored in PostgreSQL database
2. **ML Model** → Python script (`ml/predict.py`) analyzes customer features
3. **Churn Score** → Returns probability (0-100%) and risk level
4. **SHAP Values** → Explains which factors drive the prediction
5. **Recommendations** → AI suggests specific retention actions
6. **Dashboard** → Displays insights to users based on their role

---

## 🚀 Getting Started

### Step 1: Prerequisites

Make sure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **Git** (optional) - [Download](https://git-scm.com/downloads)

### Step 2: Install Dependencies

```bash
# Install all dependencies (frontend, backend, root)
npm run install-all
```

### Step 3: Database Setup

#### Option A: Using pgAdmin (Recommended)

1. **Register Server** in pgAdmin:
   - Host: `localhost`
   - Port: `5434` (or your PostgreSQL port)
   - Username: `postgres`
   - Password: Your PostgreSQL password

2. **Create Database**:
   - Right-click "Databases" → Create → Database
   - Name: `bk_pulse`

3. **Run Schema**:
   - Open Query Tool in `bk_pulse` database
   - Open file: `server/sql/schema.sql`
   - Execute (F5)

4. **Seed Data** (Optional):
   - Open `server/sql/seed.sql`
   - Execute to populate sample data

#### Option B: Using Command Line

```bash
# Create database
createdb bk_pulse

# Run schema
psql -d bk_pulse -f server/sql/schema.sql

# Seed data (optional)
psql -d bk_pulse -f server/sql/seed.sql
```

### Step 4: Configure Environment

Create `server/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Or use the interactive script:
```bash
node server/scripts/createEnv.js
```

### Step 5: Install ML Dependencies (Optional)

If you want to use ML predictions:

```bash
cd ml
pip install -r requirements.txt
```

### Step 6: Start the Application

```bash
# Start both frontend and backend
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🔐 Login & User Roles

### Default Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Retention Officer** | officer1@bk.rw | password123 | Customer actions, notes, tasks |
| **Retention Analyst** | analyst1@bk.rw | password123 | Analytics, predictions, campaigns |
| **Retention Manager** | manager1@bk.rw | password123 | Team oversight, approvals |
| **Admin** | admin@bk.rw | password123 | System administration |

---

## 👥 Features by Role

### 🟦 Retention Officer

**Purpose**: Direct customer interaction and action execution

**Key Features**:
- ✅ **Dashboard**: View assigned customers and daily tasks
- ✅ **Customers**: Search and filter customer list
- ✅ **Customer Details**: View individual customer info, churn scores, and recommendations
- ✅ **Retention Notes**: Add and manage notes about customer interactions
- ✅ **My Tasks**: View and complete assigned tasks
- ✅ **Performance**: Track personal performance metrics

**Typical Workflow**:
1. Login → See dashboard with assigned high-risk customers
2. Review customer list → Filter by risk level
3. Open customer details → Read ML recommendations
4. Contact customer → Add retention note
5. Complete task → Update task status

**Cannot**:
- ❌ Run ML predictions
- ❌ Create campaigns
- ❌ View team analytics
- ❌ Access admin features

---

### 🔬 Retention Analyst

**Purpose**: Data analysis, predictions, and campaign management

**Key Features**:
- ✅ **Everything Officer can do** +
- ✅ **Bulk Predictions**: Update churn scores for multiple customers
- ✅ **Model Insights**: View ML model performance and metrics
- ✅ **Campaign Management**: Create and manage retention campaigns
- ✅ **Segmentation**: Create customer segments for targeting
- ✅ **Recommendations**: Monitor and manage ML-generated recommendations
- ✅ **Analysis**: Advanced customer analysis with filters
- ✅ **Reports**: Generate performance reports

**Typical Workflow**:
1. Login → View analytics dashboard
2. Run batch predictions → Update all customer churn scores
3. Create campaign → Target high-risk segment
4. Monitor campaign → Track performance metrics
5. Generate report → Export data for stakeholders

**Can Run ML Predictions**:
- Single customer: Click "Update Prediction" on customer details
- Batch: Click "Update All Predictions" on customers page

---

### 👔 Retention Manager

**Purpose**: Team oversight, strategic decisions, and approvals

**Key Features**:
- ✅ **Everything Analyst can do** +
- ✅ **Team View**: See all team members and their performance
- ✅ **Strategic Analytics**: High-level KPIs and insights
- ✅ **Budget & ROI**: Track retention budget and ROI
- ✅ **Approvals**: Approve high-value retention actions
- ✅ **Audit Logs**: View system activity logs
- ✅ **Executive Reports**: Strategic reporting

**Typical Workflow**:
1. Login → View executive dashboard
2. Review team performance → Identify top performers
3. Approve recommendations → High-value actions require approval
4. Analyze ROI → Review budget and return on retention efforts
5. Generate strategic report → Share with leadership

---

### ⚙️ Admin

**Purpose**: System administration and configuration

**Key Features**:
- ✅ **Everything Manager can do** +
- ✅ **User Management**: Create, edit, and manage users
- ✅ **System Health**: Monitor database, server, and model health
- ✅ **Data Management**: Manage data pipelines and ETL processes
- ✅ **Model Management**: Deploy, update, and monitor ML models
- ✅ **Settings**: Configure system settings
- ✅ **Backup & Maintenance**: Database backups and optimization
- ✅ **Audit Trail**: Complete system audit logs

**Typical Workflow**:
1. Login → View admin dashboard
2. Monitor system health → Check database size and performance
3. Manage users → Add new team members or update roles
4. Deploy new model → Update ML model when new version available
5. Run maintenance → Optimize database and create backups

---

## 📖 Common Workflows

### Workflow 1: Identifying At-Risk Customers

**Goal**: Find customers likely to churn

**Steps**:
1. Login as **Retention Officer** or **Analyst**
2. Go to **Customers** page
3. Filter by **Risk Level** = "High" or "Medium"
4. Sort by **Churn Score** (highest first)
5. Review list → Customers with highest scores are most at risk

**Alternative**: Use **Dashboard** → "High-Risk Customers" widget

---

### Workflow 2: Understanding Why a Customer is at Risk

**Goal**: Get AI explanation for churn prediction

**Steps**:
1. Go to **Customers** page
2. Click on a customer (eye icon or name)
3. Scroll to **"Churn Prediction Explanation"** section
4. Review **SHAP Values** → Top 5 factors driving the prediction
5. Each factor shows:
   - **Impact percentage** (how much it affects the score)
   - **Direction** (↑ increases risk / ↓ decreases risk)
   - **Current value** (customer's actual value)

**Example**: 
- Factor: "Days Since Last Transaction"
- Impact: 23.5%
- Direction: ↑ (increases risk)
- Current: 45 days
- *Meaning*: Customer hasn't transacted in 45 days, which significantly increases churn risk

---

### Workflow 3: Taking Action on a Customer

**Goal**: Execute retention actions based on ML recommendations

**Steps**:
1. Open **Customer Details** page
2. Review **"Recommended Actions"** section
3. Actions are prioritized by:
   - **High Priority**: Immediate action needed
   - **Medium Priority**: Should be done soon
   - **Low Priority**: Nice to have
4. Take action (e.g., call customer, send email, offer discount)
5. Add **Retention Note**:
   - Go to "Retention Notes" section
   - Click "Add Note"
   - Enter details of your action
   - Set priority and follow-up date
6. Update task status if task was assigned

---

### Workflow 4: Running ML Predictions

**Goal**: Update churn scores for customers

**As Retention Analyst/Manager/Admin**:

**Single Customer**:
1. Open **Customer Details** page
2. Click **"Update Prediction"** button (top right)
3. Wait 1-3 seconds
4. View updated churn score and risk level

**Batch Update**:
1. Go to **Customers** page
2. Click **"Update All Predictions"** button (yellow button in toolbar)
3. Confirm action
4. Wait 30-60 seconds (for ~100 customers)
5. Refresh page to see updated scores

**Note**: Predictions use the latest customer data from the database

---

### Workflow 5: Creating a Retention Campaign

**Goal**: Launch targeted retention campaign for a segment

**As Retention Analyst/Manager**:

1. Go to **Campaign Management** page
2. Click **"Create Campaign"**
3. Fill in campaign details:
   - **Name**: e.g., "Q4 High-Risk Retention"
   - **Description**: Campaign goals
   - **Target Segment**: Select or create segment
   - **Start/End Dates**: Campaign duration
   - **Channel**: Email, SMS, Phone, etc.
4. Save campaign
5. Campaign automatically targets customers in selected segment
6. Monitor in **Campaign Performance** page

---

### Workflow 6: Managing Team Performance

**Goal**: Oversee team performance and assignments

**As Retention Manager**:

1. Go to **Team** page
2. View team member list with metrics:
   - Customers assigned
   - Tasks completed
   - Retention rate
   - Response time
3. Click on team member → View their:
   - Assigned customers
   - Recent activities
   - Performance trends
4. Use insights to:
   - Reassign customers if needed
   - Identify training needs
   - Recognize top performers

---

### Workflow 7: Generating Reports

**Goal**: Create reports for stakeholders

**As Retention Analyst/Manager**:

1. Go to **Reports** page
2. Select report type:
   - **Performance Report**: Team/campaign performance
   - **Customer Churn Report**: Churn analysis by segment
3. Set date range and filters
4. Click **"Generate Report"**
5. Review report data
6. Click **"Export CSV"** to download

---

## 🎨 Understanding the UI

### Churn Score Indicators

**Color Coding**:
- 🟢 **Green (0-40%)**: Low risk - Customer is stable
- 🟡 **Yellow (41-70%)**: Medium risk - Monitor closely
- 🔴 **Red (71-100%)**: High risk - Immediate action needed

**Risk Level Badges**:
- **Low**: Green badge
- **Medium**: Yellow badge  
- **High**: Red badge

### Dashboard Widgets

- **Churn Overview**: Total at-risk customers and trends
- **High-Risk Customers**: List of customers needing attention
- **Priority Alerts**: Urgent tasks and actions
- **Recent Activities**: Latest customer interactions
- **Quick Actions**: Common tasks shortcuts

### Navigation

- **Sidebar**: Role-specific pages (left side)
- **Navbar**: Home, Profile, Logout (top)
- **Breadcrumbs**: Shows current page location
- **Notifications**: Alert icons for important updates

---

## 🔧 Troubleshooting

### "Cannot connect to database" error

**Solution**:
1. Check PostgreSQL is running
2. Verify `server/.env` has correct database credentials
3. Test connection: `node server/scripts/testDBConnection.js`

### "Prediction failed" error

**Solution**:
1. Ensure Python ML dependencies are installed: `pip install -r ml/requirements.txt`
2. Check `ml/predict.py` exists
3. Verify customer data in database is complete
4. Check backend server logs for details

### "Not authorized" error

**Solution**:
1. Make sure you're logged in
2. Check your role has permission for the action
3. Try logging out and back in
4. Verify JWT token hasn't expired

### Churn scores not updating

**Solution**:
1. Refresh the page
2. Check if prediction actually completed (look for success message)
3. Verify database connection
4. Check browser console (F12) for errors

### Blank pages or missing data

**Solution**:
1. Run seed script to populate sample data: `psql -d bk_pulse -f server/sql/seed.sql`
2. Check if backend API is running
3. Verify API endpoints are accessible: http://localhost:5000/api/health
4. Check browser console for API errors

---

## 📚 Additional Resources

### Documentation Files

- `README.md` - Project overview and setup
- `QUICK_SETUP.md` - Quick database setup guide
- `COMPLETE_SETUP.md` - Detailed setup instructions
- `PREDICTION_FEATURES.md` - ML prediction features guide
- `API_INTEGRATION_SUMMARY.md` - API integration status

### ML Pipeline

- `ml/README.md` - Machine learning pipeline documentation
- `ml/train_model.py` - Model training script
- `ml/predict.py` - Prediction script
- `ml/explore_data.py` - Data analysis script

### Scripts

- `server/scripts/testDBConnection.js` - Test database connection
- `server/scripts/updateChurnScores.js` - Batch update churn scores
- `server/scripts/createEnv.js` - Interactive .env file creator

---

## 💡 Tips & Best Practices

1. **Regular Predictions**: Run batch predictions weekly to keep scores updated
2. **Actionable Notes**: Always add retention notes after customer contact
3. **Segment Targeting**: Use customer segments to focus campaigns
4. **Monitor Campaigns**: Track campaign performance to improve future efforts
5. **Team Collaboration**: Use retention notes to share information with team
6. **Performance Tracking**: Regularly review performance metrics to identify improvements

---

## 🆘 Getting Help

### Common Questions

**Q: How often should I run predictions?**
A: Weekly for batch updates, or when customer data significantly changes.

**Q: Can I customize recommendations?**
A: Recommendations are AI-generated based on ML model. You can always take different actions and add notes.

**Q: How do I add more users?**
A: Admin role can add users via "Admin → Users" page.

**Q: Can I export customer data?**
A: Yes, use the Reports page to generate and export CSV reports.

**Q: What if the ML model is wrong?**
A: The model learns from historical data. You can always override recommendations with manual actions.

---

## 🎓 Quick Reference

### Keyboard Shortcuts

- `Ctrl + K` (or `Cmd + K`): Quick search (if implemented)
- `F5`: Refresh page
- `Ctrl + F`: Search on page

### Important URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### API Endpoints

- Login: `POST /api/auth/login`
- Dashboard: `GET /api/dashboard`
- Customers: `GET /api/customers`
- Predictions: `POST /api/predictions/single`
- Recommendations: `GET /api/recommendations`

---

## ✅ System Status

**Current Status**: ✅ **Fully Functional**

- ✅ 25 pages implemented and working
- ✅ ML predictions integrated
- ✅ All 4 user roles configured
- ✅ Database schema complete
- ✅ API endpoints functional
- ✅ Real-time churn scoring
- ✅ SHAP explainability
- ✅ Recommendation engine

---

**Happy Retaining! 🎯**

For technical support, contact the development team.

