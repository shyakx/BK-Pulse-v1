# BK Pulse - Role-based Churn Intelligence Platform

A comprehensive churn intelligence platform built for Bank of Kigali, featuring role-based access control and advanced analytics capabilities.

🌐 **Live Demo**: [https://bk-pulse-v2.vercel.app](https://bk-pulse-v2.vercel.app)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Reviewer/Moderator Checklist](#-reviewermoderator-checklist)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Detailed Installation](#-detailed-installation--setup)
- [Verification & Testing](#-verification--testing)
- [Project Structure](#-project-structure)
- [Live Deployment](#-live-deployment)
- [Default Login Credentials](#-default-login-credentials)
- [Features by Role](#-features-by-role)
- [API Documentation](#-api-documentation)
- [Data Model](#-data-model)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Additional Resources](#-additional-resources)
- [Contributing](#-contributing)
- [Quick Reference](#-quick-reference)

---

## 🏦 Overview

BK Pulse is a sophisticated platform designed to help Bank of Kigali identify, analyze, and prevent customer churn through data-driven insights and targeted retention strategies. The platform provides role-based dashboards, machine learning-powered churn predictions, and comprehensive analytics for retention teams.

### Key Features

- **Role-Based Access Control**: Three distinct user roles with tailored interfaces
- **ML-Powered Predictions**: Churn probability scoring using trained machine learning models
- **Real-Time Analytics**: Interactive dashboards with charts and KPIs
- **Action Management**: Track retention actions and outcomes
- **Customer Segmentation**: Advanced filtering and segmentation capabilities
- **Performance Tracking**: Individual and team performance metrics

## 📹 Video Presentations

**Project Demo**: https://youtu.be/8eXAD5smTxo

## 🚀 Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **React Router 6.8.1** - Client-side routing
- **Bootstrap 5.3.2** - CSS framework
- **Chart.js 4.4.0** - Data visualization
- **Axios 1.6.2** - HTTP client
- **React Icons 4.12.0** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18.2** - Web framework
- **PostgreSQL** - Relational database
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcryptjs 2.4.3** - Password hashing
- **pg 8.11.3** - PostgreSQL client

### Machine Learning
- **Python 3.8+** - ML runtime
- **scikit-learn** - ML algorithms
- **XGBoost, LightGBM** - Gradient boosting
- **pandas, numpy** - Data processing
- **SHAP** - Model explainability

## 👥 User Roles

1. **Retention Officer** - Direct customer interaction and action execution
2. **Retention Analyst** - Data analysis and model insights
3. **Retention Manager** - Team oversight and strategic decisions

---

## 📝 Reviewer/Moderator Checklist

If you're reviewing this project, use this checklist to verify setup and functionality:

### Pre-Review Setup
- [ ] All prerequisites are installed (Node.js, PostgreSQL, Git, Python)
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm run install-all`)
- [ ] Database created and schema applied
- [ ] Environment variables configured (`server/.env`)
- [ ] Application starts without errors (`npm run dev`)

### Functionality Testing
- [ ] Can access frontend at http://localhost:3000
- [ ] Can access backend API at http://localhost:5000
- [ ] Health check endpoint works (`/api/health`)
- [ ] Can log in with test credentials
- [ ] Dashboard loads for each role
- [ ] Customer list displays correctly
- [ ] Search and filters work
- [ ] Role-based access control works (Officer sees only assigned customers)
- [ ] API endpoints return expected data
- [ ] No console errors in browser
- [ ] No errors in server logs

### Code Quality
- [ ] Code follows consistent style
- [ ] No obvious security vulnerabilities
- [ ] Error handling is present
- [ ] Database queries use parameterized statements
- [ ] Authentication is properly implemented
- [ ] Environment variables are not hardcoded

### Documentation
- [ ] README is clear and comprehensive
- [ ] Installation steps are accurate
- [ ] API documentation is complete
- [ ] Troubleshooting section is helpful

---

## ✅ Prerequisites

Before starting, ensure you have the following installed with the correct versions:

### Required Software

| Software | Minimum Version | Recommended | Download Link |
|----------|----------------|-------------|---------------|
| **Node.js** | v16.0.0 | v18.x or v20.x LTS | [nodejs.org](https://nodejs.org/) |
| **npm** | v7.0.0 | Latest (comes with Node.js) | Included with Node.js |
| **PostgreSQL** | v12.0 | v14+ or v15+ | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | v2.20.0 | Latest | [git-scm.com](https://git-scm.com/) |
| **Python** | v3.8.0 | v3.10+ or v3.11+ | [python.org](https://www.python.org/downloads/) |

### Verify Installations

Run these commands to verify your installations:

```bash
# Check Node.js version
node --version
# Should output: v16.x.x or higher

# Check npm version
npm --version
# Should output: 7.x.x or higher

# Check PostgreSQL version
psql --version
# Should output: psql (PostgreSQL) 12.x or higher

# Check Python version
python --version
# OR
python3 --version
# Should output: Python 3.8.x or higher

# Check Git version
git --version
# Should output: git version 2.20.x or higher
```

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 2GB free space
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

---

## 🚀 Quick Start Guide

For experienced developers who want to get started quickly:

```bash
# 1. Clone repository
git clone https://github.com/shyakx/BK-Pulse-v1.git
cd BK-Pulse-v1

# 2. Install dependencies
npm run install-all

# 3. Set up database (choose one method)
# Option A: Using psql
createdb bk_pulse
psql -d bk_pulse -f server/sql/schema.sql
psql -d bk_pulse -f server/sql/seed.sql

# 4. Configure environment
cd server
# Create .env file with database credentials (see detailed setup below)
# Copy the example and edit:
# Windows: copy env.example .env
# Linux/Mac: cp env.example .env

# 5. Start application
cd ..
npm run dev

# 6. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

**Default Login Credentials:**
- **Retention Officer**: `officer1@bk.rw` / `password`
- **Retention Analyst**: `analyst1@bk.rw` / `password`
- **Retention Manager**: `manager1@bk.rw` / `password`

---

## 🛠️ Detailed Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/shyakx/BK-Pulse-v1.git

# Navigate to the project directory
cd BK-Pulse-v1

# Verify you're in the correct directory
# You should see folders: client/, server/, data/, ml/, etc.
ls
# Windows: dir
```

**Expected Output:**
```
client/
server/
data/
ml/
docs/
package.json
README.md
```

### Step 2: Install Dependencies

The project uses a monorepo structure with separate `package.json` files for root, server, and client.

```bash
# Install all dependencies (root, server, and client)
npm run install-all

# This command runs:
# 1. npm install (root dependencies)
# 2. cd server && npm install (backend dependencies)
# 3. cd client && npm install (frontend dependencies)
```

**Expected Output:**
```
> npm install
> cd server && npm install
> cd client && npm install

added 150 packages in 30s
added 200 packages in 45s
added 300 packages in 60s
```

**Troubleshooting:**
- If you get permission errors, try: `npm install --legacy-peer-deps`
- If installation fails, delete `node_modules` folders and `package-lock.json` files, then retry
- On Windows, you may need to run PowerShell as Administrator

**Verification:**
```bash
# Check that node_modules exist
ls server/node_modules
ls client/node_modules
```

### Step 3: Set Up PostgreSQL Database

You need to create a PostgreSQL database and run the schema and seed files.

#### Option A: Using Command Line (Linux/Mac/Windows with psql in PATH)

```bash
# Create database (you may need to enter PostgreSQL password)
createdb -U postgres bk_pulse

# Verify database was created
psql -U postgres -l | grep bk_pulse

# Run schema to create tables
psql -U postgres -d bk_pulse -f server/sql/schema.sql

# Run seed to populate initial data
psql -U postgres -d bk_pulse -f server/sql/seed.sql

# Verify tables were created
psql -U postgres -d bk_pulse -c "\dt"
```

**Expected Output:**
```
List of relations
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | users           | table | postgres
 public | customers       | table | postgres
 public | actions         | table | postgres
 public | recommendations | table | postgres
 ...
```

#### Option B: Using pgAdmin (Windows/Mac/Linux - GUI Tool)

1. **Open pgAdmin** (usually available after PostgreSQL installation)
2. **Connect to PostgreSQL server** (enter your master password if prompted)
3. **Right-click on "Databases"** → **Create** → **Database**
4. **Enter database name**: `bk_pulse`
5. **Click "Save"**
6. **Expand "bk_pulse"** → **Right-click "bk_pulse"** → **Query Tool**
7. **Open `server/sql/schema.sql`** in a text editor, copy all content
8. **Paste into Query Tool** and click **Execute (F5)**
9. **Repeat for `server/sql/seed.sql`**

#### Option C: Using psql Command Line (Windows - Full Path)

```powershell
# Open PowerShell or Command Prompt
# Navigate to PostgreSQL bin directory (adjust version number)
cd "C:\Program Files\PostgreSQL\15\bin"

# Create database
.\createdb.exe -U postgres bk_pulse

# Run schema (adjust path to your project)
.\psql.exe -U postgres -d bk_pulse -f "D:\Projects\BK-Pulse-v1\server\sql\schema.sql"

# Run seed
.\psql.exe -U postgres -d bk_pulse -f "D:\Projects\BK-Pulse-v1\server\sql\seed.sql"
```

**Note:** Replace `15` with your PostgreSQL version and adjust the project path.

#### Option D: Using Docker (Alternative)

If you have Docker installed:

```bash
# Run PostgreSQL in Docker
docker run --name bk-pulse-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bk_pulse \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds for database to start, then run schema
psql -h localhost -U postgres -d bk_pulse -f server/sql/schema.sql
psql -h localhost -U postgres -d bk_pulse -f server/sql/seed.sql
```

### Step 4: Configure Environment Variables

The server requires a `.env` file with database credentials and configuration.

#### Create .env File

**Windows (PowerShell):**
```powershell
cd server
if (Test-Path env.example) {
    Copy-Item env.example .env
} else {
    New-Item -ItemType File -Name .env
}
notepad .env
```

**Windows (Command Prompt):**
```cmd
cd server
copy env.example .env
notepad .env
```

**Linux/Mac:**
```bash
cd server
cp env.example .env
nano .env
# OR
code .env  # If you have VS Code
```

#### Configure .env File

Edit the `.env` file with your actual values:

```env
# Database Configuration
# Use individual variables OR DATABASE_URL (not both)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=postgres123

# OR use DATABASE_URL (for cloud hosting)
# DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/bk_pulse

# JWT Configuration
# Generate a random 32+ character string for production
# You can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example generated secret: 73396c6d82d138ba49c242a2fc32418af51000f2dd703735121cfd0cb7ef2b10
JWT_SECRET=73396c6d82d138ba49c242a2fc32418af51000f2dd703735121cfd0cb7ef2b10
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
# For development, allow localhost
CORS_ORIGIN=http://localhost:3000
```

**Important Notes:**
- Replace `postgres123` with your actual PostgreSQL password (the example uses a common default)
- For `JWT_SECRET`, the example shows a generated secret. Generate your own:
  ```bash
  # Generate JWT secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- The `.env` file should be in `server/` directory, NOT in the root
- Never commit `.env` to Git (it's in `.gitignore`)
- These are example values - replace with your actual credentials

**Verify .env File:**
```bash
# Check that .env exists
ls server/.env
# Windows: dir server\.env

# Verify it's not empty (don't show contents for security)
wc -l server/.env
# Windows: (Get-Content server\.env).Count
```

### Step 5: Set Up Python ML Environment (Optional)

The ML prediction features require Python and additional packages. The app can run without this, but predictions won't work.

```bash
# Navigate to ML directory
cd ml

# Check Python is available
python --version
# OR
python3 --version

# Install ML dependencies
pip install -r requirements.txt
# OR
pip3 install -r requirements.txt

# If you get permission errors, use:
pip install --user -r requirements.txt

# Verify installation
python -c "import sklearn; print('scikit-learn:', sklearn.__version__)"
python -c "import xgboost; print('XGBoost:', xgboost.__version__)"

# Return to root directory
cd ..
```

**Note:** If ML setup fails, the application will still run, but prediction endpoints will return errors.

### Step 6: Start the Application

#### Development Mode (Recommended for Development/Testing)

This runs both frontend and backend concurrently with hot-reload:

```bash
# From project root directory
npm run dev
```

**Expected Output:**
```
[SERVER] Server running on port 5000
[SERVER] ✓ Database connected
[CLIENT] Compiled successfully!
[CLIENT] webpack compiled with 0 warnings
[CLIENT] Local:            http://localhost:3000
```

**What This Does:**
- Starts backend server on `http://localhost:5000`
- Starts React development server on `http://localhost:3000`
- Enables hot-reload for both frontend and backend
- Shows logs from both servers

**Access Points:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

#### Production Mode (Single Server)

For production-like testing:

```bash
# Build the React frontend
npm run build

# Start production server (serves both API and static frontend)
npm start

# Application available at: http://localhost:5000
```

**Note:** In production mode, the backend serves the built React app, so you only need one port.

### Step 7: Verify Installation

#### Check Backend is Running

```bash
# Test API health endpoint
curl http://localhost:5000/api/health

# OR open in browser:
# http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

#### Check Frontend is Running

1. Open browser: http://localhost:3000
2. You should see the login page
3. Check browser console (F12) for any errors

#### Test Login

1. Navigate to http://localhost:3000
2. Use test credentials:
   - Email: `officer1@bk.rw`
   - Password: `password`
3. You should be redirected to the dashboard

---

## ✅ Verification & Testing

### 1. Database Connection Test

```bash
# Test database connection from command line
psql -U postgres -d bk_pulse -c "SELECT COUNT(*) FROM users;"

# Should return a number (e.g., 3 for default users)
```

### 2. API Endpoint Tests

Using `curl` or Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer1@bk.rw","password":"password"}'

# Should return JWT token
```

### 3. Frontend Functionality Tests

1. **Login Test**
   - [ ] Can log in with test credentials
   - [ ] Redirects to dashboard after login
   - [ ] Shows correct role-based dashboard

2. **Dashboard Test**
   - [ ] Dashboard loads without errors
   - [ ] Charts and metrics display correctly
   - [ ] Navigation menu works

3. **Customer List Test**
   - [ ] Can view customer list
   - [ ] Search functionality works
   - [ ] Filters work correctly

4. **Role-Based Access Test**
   - [ ] Retention Officer sees only assigned customers
   - [ ] Retention Analyst sees team-level data
   - [ ] Retention Manager sees executive dashboard

### 4. Database Verification

```sql
-- Connect to database
psql -U postgres -d bk_pulse

-- Check tables exist
\dt

-- Check users were created
SELECT id, email, role FROM users;

-- Check customers were created
SELECT COUNT(*) FROM customers;

-- Check seed data
SELECT COUNT(*) FROM actions;
SELECT COUNT(*) FROM recommendations;

-- Exit
\q
```

**Expected Results:**
- At least 3 users (one for each role)
- Multiple customers (from seed data)
- Some actions and recommendations

---

## 🏗️ Project Structure

```
BK-PULSE/
├── client/                      # React Frontend Application
│   ├── public/                  # Static assets
│   │   ├── index.html          # HTML template
│   │   └── favicon.ico         # Site icon
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── Layout/        # Layout components (Navbar, Sidebar)
│   │   │   ├── Dashboard/     # Dashboard-specific components
│   │   │   ├── Customers/     # Customer-related components
│   │   │   └── Common/        # Shared components (Loading, Error, etc.)
│   │   ├── pages/             # Page components (routes)
│   │   │   ├── Dashboard.js
│   │   │   ├── Customers.js
│   │   │   ├── Predictions.js
│   │   │   └── ...
│   │   ├── contexts/         # React Context providers
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── services/         # API service layer
│   │   │   └── api.js        # Axios configuration and API calls
│   │   ├── config/           # Configuration files
│   │   │   └── pages.js     # Page configuration by role
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   ├── package.json         # Frontend dependencies
│   └── .env                 # Frontend environment variables (optional)
│
├── server/                   # Node.js Backend API
│   ├── config/              # Configuration files
│   │   └── database.js      # PostgreSQL connection pool
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── errorHandler.js # Error handling middleware
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication routes
│   │   ├── dashboard.js    # Dashboard data routes
│   │   ├── customers.js    # Customer CRUD routes
│   │   ├── predictions.js  # ML prediction routes
│   │   ├── actions.js      # Action tracking routes
│   │   ├── recommendations.js # Recommendation routes
│   │   └── ...
│   ├── sql/                # Database scripts
│   │   ├── schema.sql      # Database schema (CREATE TABLE statements)
│   │   ├── seed.sql        # Seed data (INSERT statements)
│   │   └── *.sql          # Migration/update scripts
│   ├── utils/             # Utility functions
│   │   └── mlPredictor.js  # ML model prediction utilities
│   ├── scripts/           # Utility scripts
│   │   └── *.js          # Database scripts, data generators
│   ├── index.js          # Server entry point
│   ├── package.json      # Backend dependencies
│   └── .env              # Backend environment variables (REQUIRED)
│
├── data/                   # Data and ML Models
│   ├── raw/              # Original, unprocessed datasets
│   ├── processed/        # Cleaned and preprocessed datasets
│   └── models/           # Trained ML model files (.pkl, .joblib)
│
├── ml/                    # Machine Learning Pipeline
│   ├── requirements.txt  # Python dependencies
│   └── *.ipynb          # Jupyter/Colab notebooks (if any)
│
├── docs/                  # Project Documentation
│   ├── proposal/        # Project proposal documents
│   └── technical/       # Technical documentation
│
├── package.json          # Root package.json (scripts for monorepo)
├── .gitignore           # Git ignore rules
└── README.md           # This file
```

### Key Files Explained

- **`client/src/App.js`**: Main React app, defines routes and layout
- **`server/index.js`**: Express server setup, middleware, route registration
- **`server/config/database.js`**: PostgreSQL connection pool configuration
- **`server/sql/schema.sql`**: Database schema (tables, constraints, indexes)
- **`server/sql/seed.sql`**: Initial data (users, customers, etc.)
- **`server/.env`**: Environment variables (database, JWT, etc.) - **REQUIRED**

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/shyakx/BK-Pulse-v1.git

# Navigate to the project directory
cd BK-Pulse-v1
```

#### Step 2: Install Dependencies

```bash
# Install dependencies for root, server, and client
npm run install-all

# This will install:
# - Root dependencies (for development scripts)
# - Server dependencies (Node.js backend)
# - Client dependencies (React frontend)
```

**Note**: This may take a few minutes depending on your internet connection.

#### Step 3: Set Up PostgreSQL Database

##### Option A: Using Command Line (Recommended for Linux/Mac)

```bash
# Create a new PostgreSQL database
createdb bk_pulse

# Or if you need to specify user:
createdb -U postgres bk_pulse

# Run the schema file to create tables
psql -d bk_pulse -f server/sql/schema.sql

# Run the seed file to populate initial data
psql -d bk_pulse -f server/sql/seed.sql
```

##### Option B: Using pgAdmin (Windows/Visual Tool)

1. Open pgAdmin
2. Create a new database named `bk_pulse`
3. Right-click on the database → Query Tool
4. Open `server/sql/schema.sql` and execute it
5. Open `server/sql/seed.sql` and execute it

##### Option C: Using psql Command Line (Windows)

```bash
# Open PowerShell or Command Prompt as Administrator
# Navigate to PostgreSQL bin directory (e.g., C:\Program Files\PostgreSQL\15\bin)

# Create database
.\createdb.exe -U postgres bk_pulse

# Run schema
.\psql.exe -U postgres -d bk_pulse -f "D:\Projects\BK-PULSE\server\sql\schema.sql"

# Run seed
.\psql.exe -U postgres -d bk_pulse -f "D:\Projects\BK-PULSE\server\sql\seed.sql"
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the `server/` directory:

**On Windows:**
```bash
cd server
copy env.example .env
notepad .env
```

**On Linux/Mac:**
```bash
cd server
cp env.example .env
nano .env
```

Edit the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT Configuration (generate a random string for production)
# Example: Use node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=73396c6d82d138ba49c242a2fc32418af51000f2dd703735121cfd0cb7ef2b10
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for development)
CORS_ORIGIN=http://localhost:3000
```

**Important**: 
- Replace `postgres123` with your actual PostgreSQL password (this is just an example)
- For production, generate a new random string for `JWT_SECRET` using the command shown above
- If your PostgreSQL is on a different port, update `DB_PORT`

#### Step 5: Set Up Python ML Environment (Optional but Recommended)

If you want to use the ML prediction features:

```bash
# Navigate to ML directory
cd ml

# Install Python dependencies
pip install -r requirements.txt

# Or use pip3 if pip is for Python 2
pip3 install -r requirements.txt

# Return to root directory
cd ..
```

**Note**: The application can run without Python setup, but prediction features will not work.

### 4. Start the Application

#### Development Mode (Recommended for Development)

```bash
# Start both frontend and backend concurrently
npm run dev

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
```

#### Production Mode (Single Server)

```bash
# Build the frontend first
npm run build

# Start the production server (serves both API and frontend)
npm start

# The application will be available at:
# - Full Application: http://localhost:5000
```

### 5. Access the Application

Once started, open your browser and navigate to:
- **Development**: http://localhost:3000
- **Production**: http://localhost:5000
- **Live Deployment**: [https://bk-pulse-v2.vercel.app](https://bk-pulse-v2.vercel.app)

Login using the credentials provided in the "Default Login Credentials" section above.

## 🌐 Live Deployment

**🚀 Application URL:** [https://bk-pulse-v2.vercel.app](https://bk-pulse-v2.vercel.app)

The application is deployed and accessible online. You can test all features using the credentials below.

**Tech Stack:**
- **Frontend**: Vercel (React)
- **Backend**: Render (Node.js/Express)
- **Database**: Render PostgreSQL

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Retention Officer | officer1@bk.rw | password |
| Retention Analyst | analyst1@bk.rw | password |
| Retention Manager | manager1@bk.rw | password |

## 📊 Features by Role

### Retention Officer
- Personalized dashboard with assigned customers
- Customer list with filtering capabilities
- Individual customer details and churn scores
- Action logging and outcome tracking
- Personal performance reports

### Retention Analyst
- Team-level analytics dashboard
- Advanced customer segmentation
- Model insights and explainability
- Recommendation monitoring
- Team performance reports

### Retention Manager
- Executive dashboard with KPIs
- Team and customer oversight
- Recommendation approvals
- Strategic analytics and reporting
- Model performance monitoring


## 🎨 Design System

The application uses Bank of Kigali's brand colors and follows a consistent design system:

- **Primary Blue**: #1e3a8a
- **White**: #ffffff
- **Accent Gold**: #f59e0b
- **Typography**: Inter font family
- **Components**: Bootstrap 5 with custom styling

## 🔧 API Documentation

### Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://bk-pulse-api.onrender.com/api` (example - replace with your actual backend URL)

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### `POST /api/auth/login`
User login endpoint.

**Request:**
```json
{
  "email": "officer1@bk.rw",
  "password": "password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "officer1@bk.rw",
    "name": "John Officer",
    "role": "retentionOfficer"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### `GET /api/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "officer1@bk.rw",
  "name": "John Officer",
  "role": "retentionOfficer",
  "is_active": true
}
```

#### `POST /api/auth/logout`
Logout endpoint (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Dashboard Endpoints

#### `GET /api/dashboard/overview`
Get role-specific dashboard data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK) - Retention Officer:**
```json
{
  "totalCustomers": 45,
  "highRiskCustomers": 12,
  "pendingActions": 8,
  "completedActions": 23,
  "riskDistribution": {
    "low": 20,
    "medium": 13,
    "high": 12
  },
  "recentCustomers": [...],
  "recentActions": [...]
}
```

**Response (200 OK) - Retention Analyst:**
```json
{
  "totalCustomers": 150,
  "teamHighRisk": 35,
  "averageChurnScore": 42.5,
  "segmentDistribution": {...},
  "modelMetrics": {...}
}
```

**Response (200 OK) - Retention Manager:**
```json
{
  "totalCustomers": 500,
  "totalOfficers": 15,
  "overallChurnRate": 12.5,
  "teamPerformance": {...},
  "kpis": {...}
}
```

### Customer Endpoints

#### `GET /api/customers`
Get paginated list of customers with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search by name or customer_id
- `segment` (string) - Filter by segment (retail, sme, corporate, institutional_banking)
- `risk_level` (string) - Filter by risk (low, medium, high)
- `branch` (string) - Filter by branch
- `min_churn_score` (number) - Minimum churn score
- `max_churn_score` (number) - Maximum churn score

**Example:**
```
GET /api/customers?page=1&limit=20&risk_level=high&min_churn_score=50
```

**Response (200 OK):**
```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "customer_id": "CUST001",
      "name": "John Doe",
      "email": "john@example.com",
      "segment": "retail",
      "churn_score": 65.5,
      "risk_level": "high",
      "account_balance": 5000000,
      "assigned_officer_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### `GET /api/customers/:id`
Get single customer details.

**Response (200 OK):**
```json
{
  "success": true,
  "customer": {
    "id": 1,
    "customer_id": "CUST001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+250788123456",
    "segment": "retail",
    "branch": "Kigali Main",
    "churn_score": 65.5,
    "risk_level": "high",
    "account_balance": 5000000,
    "assigned_officer": {
      "id": 1,
      "name": "Jane Officer"
    },
    "actions": [...],
    "recommendations": [...]
  }
}
```

### Prediction Endpoints (ML Model)

#### `POST /api/predictions/single`
Predict churn for a single customer using ML model.

**Access:** Retention Officer, Retention Analyst, Retention Manager

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "customer_data": {
  "Age": 45,
  "Tenure_Months": 60,
  "Customer_Segment": "Retail",
  "Balance": 10000000,
  "Account_Status": "Active",
    "Transaction_Frequency": 12,
    "Days_Since_Last_Transaction": 15,
    "Has_Mobile_Banking": true,
    "Has_Online_Banking": true,
    "Number_of_Products": 3,
    "Branch_Visits": 2
  },
  "include_shap": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "prediction": {
    "churn_probability": 0.35,
    "churn_prediction": 0,
    "churn_score": 35,
    "risk_level": "medium",
    "shap_values": {...}  // Only if include_shap=true
  }
}
```

#### `POST /api/predictions/customer/:id`
Predict and update churn score for a customer by ID.

**Request:**
```
POST /api/predictions/customer/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "prediction": {
    "churn_score": 45.5,
    "risk_level": "medium",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

#### `POST /api/predictions/batch`
Batch predict churn for multiple customers.

**Request:**
```json
{
  "customer_ids": [1, 2, 3, 4, 5]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "predictions": [
    {"customer_id": 1, "churn_score": 45.5, "risk_level": "medium"},
    {"customer_id": 2, "churn_score": 72.3, "risk_level": "high"},
    ...
  ],
  "total": 5,
  "updated": 5
}
```

#### `GET /api/predictions/model-info`
Get model information and performance metrics.

**Response (200 OK):**
```json
{
  "success": true,
  "model": {
    "name": "XGBoost Classifier",
    "version": "1.0.0",
    "accuracy": 0.87,
    "precision": 0.85,
    "recall": 0.82,
    "f1_score": 0.83,
    "roc_auc": 0.91,
    "trained_at": "2025-01-10T08:00:00.000Z"
  }
}
```

### Actions Endpoints

#### `GET /api/actions`
Get actions with filtering.

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `customer_id` - Filter by customer
- `officer_id` - Filter by officer

#### `POST /api/actions`
Create a new action.

**Request:**
```json
{
  "customer_id": 1,
  "action_type": "Phone Call",
  "description": "Follow up on account concerns",
  "priority": "high",
  "due_date": "2025-01-20"
}
```

### Recommendations Endpoints

#### `GET /api/recommendations`
Get recommendations with filtering.

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, implemented)
- `officer_id` - Filter by assigned officer
- `min_confidence` - Minimum confidence score

#### `POST /api/recommendations/:id/approve`
Approve a recommendation (Manager only).

#### `POST /api/recommendations/:id/reject`
Reject a recommendation (Manager only).

### Analytics Endpoints

#### `GET /api/analytics/segmentation`
Get customer segmentation analytics.

#### `GET /api/analytics/trends`
Get churn trends over time.

### Performance Endpoints

#### `GET /api/performance`
Get performance metrics for current user (Officer only).

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

### Team Endpoints

#### `GET /api/team/members`
Get team members list (Analyst, Manager).

#### `GET /api/team/performance`
Get team performance metrics (Manager).

### Reports Endpoints

#### `GET /api/reports/customers`
Generate customer report.

#### `GET /api/reports/actions`
Generate actions report.

### Health Check

#### `GET /api/health`
Check API health status.

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [...]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details (development only)"
}
```

## 📈 Data Model

The platform uses a comprehensive PostgreSQL database schema with the following main tables:

### Core Tables

- **`users`** - User accounts with role-based access
  - Roles: `retentionOfficer`, `retentionAnalyst`, `retentionManager`
  - Authentication via JWT tokens

- **`customers`** - Customer profiles and churn data
  - Churn scores (0-100)
  - Risk levels (low, medium, high)
  - Customer segments (retail, sme, corporate, institutional_banking)
  - Assignment to retention officers

- **`actions`** - Retention actions and outcomes
  - Action types (Phone Call, Email, Meeting, etc.)
  - Status tracking (pending, in_progress, completed, cancelled)
  - Priority levels and due dates
  - Outcome tracking

- **`recommendations`** - ML-generated retention recommendations
  - Recommended actions based on churn prediction
  - Confidence scores
  - Approval workflow (Manager approval required)

- **`customer_assignments`** - Officer-customer assignments
  - Assignment history
  - Assignment dates

- **`segments`** - Customer segmentation definitions
  - Custom segment criteria
  - Segment membership

- **`campaigns`** - Retention campaigns
  - Campaign definitions
  - Campaign performance tracking

- **`retention_notes`** - Notes and observations
  - Customer interaction notes
  - Timestamps and officer attribution

### Relationships

- Users → Customers (one-to-many via `assigned_officer_id`)
- Customers → Actions (one-to-many)
- Customers → Recommendations (one-to-many)
- Customers → Assignments (one-to-many)

### Database Schema Location

Full schema definition: `server/sql/schema.sql`

## 🤖 Machine Learning Pipeline

The platform uses machine learning models to predict customer churn probability. The ML pipeline includes data preprocessing, feature engineering, model training, and prediction serving.

### ML Model Overview

- **Purpose**: Predict customer churn probability (0-100 score)
- **Models Used**: XGBoost, LightGBM, Random Forest, Gradient Boosting, Logistic Regression
- **Best Model**: XGBoost (typically achieves 85-90% accuracy)
- **Features**: 20+ engineered features including balance, transaction frequency, tenure, product usage, etc.

### Setup ML Environment

1. **Install Python** (v3.8 or higher)
   ```bash
   python --version  # Should be 3.8+
   ```

2. **Install ML Dependencies**:
   ```bash
   cd ml
   pip install -r requirements.txt
   # OR
   pip3 install -r requirements.txt
   ```

3. **Verify Installation**:
   ```bash
   python -c "import sklearn, xgboost, lightgbm, pandas, numpy; print('All packages installed')"
   ```

### Training Workflow

The ML pipeline is designed to run in **Google Colab** for easy access to computational resources. Alternatively, you can run locally if you have sufficient resources.

#### Option 1: Google Colab (Recommended)

1. Open Google Colab: https://colab.research.google.com
2. Upload or clone the repository
3. Open the Colab notebook (if available) or create a new notebook
4. Follow the notebook cells for:
   - Data loading and exploration
   - Data preprocessing and feature engineering
   - Model training and evaluation
   - Model saving

#### Option 2: Local Training

If training locally, ensure you have:
- Sufficient RAM (8GB+ recommended)
- Python 3.8+ with all dependencies
- Training dataset in `data/raw/`

**Training Steps:**

1. **Data Preparation**:
   - Place raw dataset in `data/raw/`
   - Ensure data format matches expected schema

2. **Exploratory Data Analysis**:
   ```bash
   python ml/explore_data.py
   ```
   - Analyzes dataset structure and distributions
   - Generates visualizations and statistics
   - Outputs saved to `data/processed/eda_results/`

3. **Data Preprocessing**:
   ```bash
   python ml/preprocess.py
   ```
   - Cleans and transforms raw data
   - Handles missing values and encodes categorical variables
   - Feature engineering (balance ratios, activity scores, etc.)
   - Splits data into train/test sets
   - Outputs saved to `data/processed/`

4. **Model Training**:
   ```bash
   python ml/train_model.py
   ```
   - Trains multiple models (Logistic Regression, Random Forest, Gradient Boosting, XGBoost, LightGBM)
   - Evaluates and compares model performance
   - Selects best model based on ROC-AUC score
   - Saves best model to `data/models/best_model.pkl` or `.joblib`

5. **Model Evaluation**:
   - Accuracy, Precision, Recall, F1-Score
   - ROC-AUC curve
   - Feature importance analysis
   - SHAP values for explainability

### Model Deployment

After training, the model file should be placed in:
```
data/models/best_model.pkl  # or .joblib
```

The backend automatically loads this model when making predictions via `server/utils/mlPredictor.js`.

### Prediction API Integration

The trained model is used by the backend API:
- `POST /api/predictions/single` - Single customer prediction
- `POST /api/predictions/batch` - Batch predictions
- `POST /api/predictions/customer/:id` - Predict and update customer score

### Model Retraining

Models should be retrained periodically (monthly/quarterly) with new data:
1. Collect new customer data
2. Run the full training pipeline
3. Compare new model performance with existing model
4. Deploy new model if performance improves
5. Update model version in database

### Feature Engineering

The model uses engineered features including:
- `Balance_Per_Product` - Average balance per product
- `Transaction_Value_Ratio` - Transaction value relative to balance
- `Activity_Ratio` - Transaction frequency relative to tenure
- `Engagement_Score` - Combined engagement metric
- `Risk_Score` - Calculated risk indicator
- Binned features for categorical encoding


### Utility Scripts

Available in `server/scripts/` (if they exist):

- **`updateChurnScores.js`** - Update customer churn scores using ML model
  ```bash
  cd server
  node scripts/updateChurnScores.js
  ```

- **`addCustomersBatch.js`** - Add customers in batches to the database
  ```bash
  node scripts/addCustomersBatch.js
  ```

- **`generateCustomers.js`** - Generate customer data for seeding
  ```bash
  node scripts/generateCustomers.js
  ```

- **`createEnv.js`** - Interactive .env file creator
  ```bash
  node scripts/createEnv.js
  ```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**
- Verify PostgreSQL is running:
  ```bash
  # Windows
  Get-Service postgresql*
  
  # Linux/Mac
  sudo systemctl status postgresql
  ```
- Check database credentials in `server/.env`
- Verify database exists: `psql -U postgres -l | grep bk_pulse`
- Check PostgreSQL port (default: 5432)

#### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Or change port in server/.env
PORT=5001
```

#### 3. Module Not Found Errors

**Error:** `Cannot find module 'express'` or similar

**Solutions:**
```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

# Or from root
npm run install-all
```

#### 4. CORS Errors in Browser

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions:**
- Verify `CORS_ORIGIN` in `server/.env` includes your frontend URL
- In development, ensure `NODE_ENV=development` (allows all origins)
- Check that backend is running on correct port

#### 5. JWT Authentication Errors

**Error:** `Invalid token` or `Token expired`

**Solutions:**
- Clear browser localStorage/sessionStorage
- Log out and log back in
- Check `JWT_SECRET` is set in `server/.env`
- Verify token expiration: `JWT_EXPIRE=7d`

#### 6. Frontend Build Errors

**Error:** Build fails with module errors

**Solutions:**
```bash
cd client
rm -rf node_modules package-lock.json build
npm install
npm run build
```

#### 7. ML Prediction Errors

**Error:** `Model file not found` or prediction fails

**Solutions:**
- Verify model file exists: `data/models/best_model.pkl` (or `.joblib`)
- Check Python dependencies: `pip list | grep scikit-learn`
- Verify model file format matches what `mlPredictor.js` expects
- Check server logs for detailed error messages

#### 8. Database Schema Errors

**Error:** `relation "users" does not exist`

**Solutions:**
```bash
# Re-run schema
psql -U postgres -d bk_pulse -f server/sql/schema.sql

# Verify tables exist
psql -U postgres -d bk_pulse -c "\dt"
```

#### 9. Environment Variable Issues

**Error:** `process.env.DB_HOST is undefined`

**Solutions:**
- Verify `.env` file exists in `server/` directory (not root)
- Check `.env` file syntax (no spaces around `=`)
- Restart server after changing `.env`
- Verify `dotenv` is loading: `require('dotenv').config()`

#### 10. React App Won't Start

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or change port
# Create client/.env with:
PORT=3001
```

### Getting Help

If you encounter issues not listed here:

1. **Check Server Logs**: Look at terminal output for detailed error messages
2. **Check Browser Console**: Open DevTools (F12) and check Console tab
3. **Verify Prerequisites**: Ensure all required software is installed and up to date
4. **Check Database**: Verify database is running and accessible
5. **Review Environment Variables**: Ensure all required variables are set correctly

---

## 🚀 Deployment

### Local Production Build

Test production build locally:

```bash
# Build the React frontend
npm run build

# Start production server (serves both API and static frontend)
npm start

# Application available at: http://localhost:5000
```

**Note:** In production mode, the backend serves the built React app, so you only access one URL.

### Cloud Hosting Options

The application can be deployed to various cloud platforms:

#### Current Deployment

- **Frontend**: Vercel (https://bk-pulse-v2.vercel.app)
- **Backend**: Render or DigitalOcean (Node.js/Express API)
- **Database**: PostgreSQL (Render, DigitalOcean, or Supabase)

#### Recommended Platforms

| Platform | Frontend | Backend | Database | Free Tier |
|----------|----------|---------|----------|-----------|
| **Vercel** | ✅ Excellent | ⚠️ Limited | ❌ No | ✅ Yes |
| **Render** | ✅ Good | ✅ Good | ✅ Yes | ⚠️ Limited (1 free DB) |
| **DigitalOcean** | ✅ Good | ✅ Good | ✅ Yes | ⚠️ Limited |
| **Railway** | ✅ Good | ✅ Good | ✅ Yes | ⚠️ Limited |
| **Fly.io** | ✅ Good | ✅ Good | ⚠️ Self-host | ✅ Yes |
| **Supabase** | ❌ No | ❌ No | ✅ Excellent | ✅ Yes (500MB) |

#### Deployment Guides

- **Render Setup**: See `RENDER_SETUP.md` (if available)
- **DigitalOcean Setup**: See `DIGITALOCEAN_SETUP.md`
- **Vercel**: Connect GitHub repo, set build command: `npm run build`, output directory: `client/build`

### Production Environment Variables

Ensure all production environment variables are properly configured:

**Backend (.env or platform environment variables):**
```env
# Database (use DATABASE_URL for cloud)
DATABASE_URL=postgresql://bk_pulse_user:SecurePass123@dpg-xxxxx-a.oregon-postgres.render.com:5432/bk_pulse_xxxx?sslmode=require
# OR individual variables:
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bk_pulse_xxxx
DB_USER=bk_pulse_user
DB_PASSWORD=SecurePass123
DB_SSL=true

# JWT (generate strong random string - example shown)
JWT_SECRET=73396c6d82d138ba49c242a2fc32418af51000f2dd703735121cfd0cb7ef2b10
JWT_EXPIRE=7d

# Server
PORT=10000  # Or platform default
NODE_ENV=production

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=https://bk-pulse-v2.vercel.app,https://www.bankofkigali.rw
```

**Frontend (Vercel environment variables):**
```env
REACT_APP_API_URL=https://bk-pulse-api.onrender.com/api
```

**Note:** Replace the example values above with your actual:
- Database connection details from your hosting provider
- Generated JWT secret (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Your actual frontend and backend URLs

### Deployment Checklist

- [ ] Database is created and accessible
- [ ] Database schema is applied (`schema.sql`)
- [ ] Seed data is loaded (`seed.sql`) - optional for production
- [ ] Environment variables are set on hosting platform
- [ ] JWT_SECRET is a strong random string
- [ ] CORS_ORIGIN includes all frontend URLs
- [ ] Frontend API URL points to backend
- [ ] ML model file is accessible (if using predictions)
- [ ] SSL/HTTPS is enabled
- [ ] Database backups are configured
- [ ] Monitoring/logging is set up

### Post-Deployment Verification

1. **Health Check**: `GET https://bk-pulse-api.onrender.com/api/health` (replace with your actual backend URL)
2. **Frontend Loads**: Visit frontend URL
3. **Login Works**: Test with default credentials
4. **API Calls Work**: Check browser Network tab
5. **Database Queries**: Verify data loads correctly

## 📚 Additional Resources

### Documentation Files

- **`RENDER_SETUP.md`** - Detailed guide for deploying on Render
- **`DIGITALOCEAN_SETUP.md`** - Detailed guide for deploying on DigitalOcean
- **`ml/ML_Pipeline_Architecture.puml`** - ML pipeline architecture diagram

### External Resources

- **React Documentation**: https://react.dev
- **Express.js Guide**: https://expressjs.com/en/guide/routing.html
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/current/tutorial.html
- **JWT Introduction**: https://jwt.io/introduction

### Video Tutorials

- **Project Demo**: https://youtu.be/8eXAD5smTxo

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test your changes**:
   - Test locally before submitting
   - Verify all features still work
   - Check for console errors
5. **Commit your changes**: `git commit -m "Add: description of changes"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Submit a pull request** with a clear description

### Code Style Guidelines

- Use consistent indentation (2 spaces for JavaScript)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions focused and small
- Handle errors appropriately

---

## 📝 License

This project is proprietary software developed for Bank of Kigali.

**Copyright © 2025 Bank of Kigali. All rights reserved.**

---

## 👨‍💻 Author & Contact

**Steven SHYAKA**  
*Senior Software Developer*  
Bank of Kigali

### Support

For technical support, questions, or issues:

1. **Check Troubleshooting Section** - Many common issues are covered
2. **Review Documentation** - Check this README and other docs
3. **Check GitHub Issues** - See if your issue was reported
4. **Contact Development Team** - For urgent matters

---

## 📊 Project Status

- ✅ **Core Features**: Complete
- ✅ **Authentication**: Implemented
- ✅ **Role-Based Access**: Implemented
- ✅ **ML Predictions**: Implemented
- ✅ **Dashboard Analytics**: Implemented
- ✅ **Database Schema**: Complete
- ✅ **API Endpoints**: Complete
- 🔄 **Testing**: In Progress
- 🔄 **Documentation**: Ongoing

---

## 🎯 Quick Reference

### Start Development Server
```bash
npm run dev
```

### Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Default Login
- Officer: `officer1@bk.rw` / `password`
- Analyst: `analyst1@bk.rw` / `password`
- Manager: `manager1@bk.rw` / `password`

### Key Commands
```bash
npm run install-all    # Install all dependencies
npm run dev           # Start development servers
npm run build         # Build for production
npm start             # Start production server
```

### Important Files
- `server/.env` - Backend environment variables (REQUIRED)
- `server/sql/schema.sql` - Database schema
- `server/sql/seed.sql` - Seed data
- `data/models/best_model.pkl` - ML model file

---

**Last Updated**: January 2025  
**Version**: 1.0.0


