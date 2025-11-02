# BK Pulse - Role-based Churn Intelligence Platform

A comprehensive churn intelligence platform built for Bank of Kigali, featuring role-based access control and advanced analytics capabilities.

## 🏦 Overview

BK Pulse is a sophisticated platform designed to help Bank of Kigali identify, analyze, and prevent customer churn through data-driven insights and targeted retention strategies.

# Video presentations

https://youtu.be/8eXAD5smTxo

## 🚀 Technology Stack

- **Frontend**: React 18 + Bootstrap 5 + Chart.js
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT-based with role-based access control
- **Styling**: Custom Bank of Kigali theme

## 👥 User Roles

1. **Retention Officer** - Direct customer interaction and action execution
2. **Retention Analyst** - Data analysis and model insights
3. **Retention Manager** - Team oversight and strategic decisions
4. **Admin** - System administration and configuration

## 🏗️ Project Structure

```
BK-PULSE/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── config/         # Configuration files
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── sql/               # Database schema and seeds
│   └── package.json
├── data/                   # Datasets for model training
│   ├── raw/               # Original, unprocessed datasets
│   ├── processed/         # Cleaned and preprocessed datasets
│   └── models/            # Trained model files
├── docs/                   # Project documentation
│   ├── proposal/          # Project proposal and evaluation documents
│   └── technical/         # Technical documentation
├── ml/                     # Machine Learning pipeline
│   ├── explore_data.py    # Exploratory data analysis
│   ├── preprocess.py      # Data preprocessing
│   ├── train_model.py     # Model training
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # ML pipeline documentation
└── package.json           # Root package.json
```

## 🛠️ Installation & Setup

### Step-by-Step Installation Guide

Follow these instructions carefully to set up the application on your local machine.

#### Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** (for cloning the repository) - [Download here](https://git-scm.com/)
- **Python 3.8+** (for ML model functionality) - [Download here](https://www.python.org/downloads/)

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
DB_PASSWORD=your_postgres_password

# JWT Configuration (generate a random string for production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for development)
CORS_ORIGIN=http://localhost:3000
```

**Important**: 
- Replace `your_postgres_password` with your actual PostgreSQL password
- For production, use a strong random string for `JWT_SECRET`
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

**Application URL:** [https://bk-pulse-v2.vercel.app](https://bk-pulse-v2.vercel.app)

The application is deployed and accessible online. You can test all features using the credentials below.

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Retention Officer | officer1@bk.rw | password |
| Retention Analyst | analyst1@bk.rw | password |
| Retention Manager | manager1@bk.rw | password |
| Admin | admin@bk.rw | password |

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

### Admin
- System health monitoring
- User management
- Data and ETL pipeline management
- Model deployment and monitoring
- Audit logs and compliance reporting

## 🎨 Design System

The application uses Bank of Kigali's brand colors and follows a consistent design system:

- **Primary Blue**: #1e3a8a
- **White**: #ffffff
- **Accent Gold**: #f59e0b
- **Typography**: Inter font family
- **Components**: Bootstrap 5 with custom styling

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/overview` - Get role-specific dashboard data

### Predictions (ML Model)
- `POST /api/predictions/single` - Predict churn for a single customer (Analyst, Manager, Admin)
- `POST /api/predictions/customer/:id` - Predict and update churn score for a customer by ID
- `POST /api/predictions/batch` - Batch predict churn for multiple customers (Analyst, Manager, Admin)
- `GET /api/predictions/model-info` - Get model information and metrics (Analyst, Manager, Admin)

**Example Prediction Request:**
```json
POST /api/predictions/single
{
  "Age": 45,
  "Tenure_Months": 60,
  "Customer_Segment": "Retail",
  "Balance": 10000000,
  "Account_Status": "Active",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "churn_probability": 0.35,
    "churn_prediction": 0,
    "churn_score": 35,
    "risk_level": "medium"
  }
}
```

## 📈 Data Model

The platform uses a comprehensive data model including:
- Users and role management
- Customer profiles and churn scores
- Actions and outcomes tracking
- Model performance metrics
- Audit logs for compliance
- System configuration

## 🤖 Machine Learning Pipeline

### Setup ML Environment

1. Install Python (v3.8 or higher)
2. Install ML dependencies:
```bash
cd ml
pip install -r requirements.txt
```

### Training Workflow

1. **Exploratory Data Analysis**:
```bash
python ml/explore_data.py
```
   - Analyzes dataset structure and distributions
   - Generates visualizations and statistics
   - Outputs saved to `data/processed/eda_results/`

2. **Data Preprocessing**:
```bash
python ml/preprocess.py
```
   - Cleans and transforms raw data
   - Handles missing values and encodes categorical variables
   - Splits data into train/test sets
   - Outputs saved to `data/processed/`

3. **Model Training**:
```bash
python ml/train_model.py
```
   - Trains multiple models (Logistic Regression, Random Forest, Gradient Boosting, XGBoost, LightGBM)
   - Evaluates and compares model performance
   - Saves best model to `data/models/`

See `ml/README.md` for detailed documentation on the ML pipeline.

## 📚 Documentation

### Project Submission Documents
- **[TESTING_RESULTS.md](TESTING_RESULTS.md)** - Comprehensive testing results, screenshots, and performance analysis
- **[ANALYSIS.md](ANALYSIS.md)** - Detailed analysis, discussion, and recommendations for the project

### Quick References
- **[QUICK_START.md](QUICK_START.md)** - Fastest way to get the application running
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user guide and feature documentation
- **[PREDICTION_FEATURES.md](PREDICTION_FEATURES.md)** - ML prediction features and usage

### Deployment & Hosting
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions for local and production
- **[VERCEL_SUPABASE_SETUP.md](VERCEL_SUPABASE_SETUP.md)** - Best performance combo: Vercel frontend + Supabase database ⭐
- **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)** - Detailed guide for hosting on cloud platforms (Railway, Fly.io, Render, Vercel)
- **[HOSTING_QUICK_START.md](HOSTING_QUICK_START.md)** - 5-minute quick setup for Render

### Technical Documentation
- **[docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)** - PostgreSQL database setup and configuration
- **[docs/PGADMIN_SETUP_GUIDE.md](docs/PGADMIN_SETUP_GUIDE.md)** - pgAdmin setup and usage
- **[ml/README.md](ml/README.md)** - Machine Learning pipeline documentation
- **[ml/PREDICTION_API.md](ml/PREDICTION_API.md)** - ML prediction API reference

## 🚀 Deployment

### Local Production Build

```bash
# Build the frontend
npm run build

# Start production server (serves both API and frontend)
npm start

# Access at http://localhost:5000
```

### Cloud Hosting

For hosting on cloud platforms (all free options):
- **[HOSTING_QUICK_START.md](HOSTING_QUICK_START.md)** - Quick setup (recommended: Railway or Fly.io)
- **[HOSTING_GUIDE.md](HOSTING_GUIDE.md)** - Detailed hosting instructions for Railway, Fly.io, Render, and Vercel

**Recommended Free Platforms:**
1. **Vercel + Supabase** ⭐⭐⭐ - Best performance (Vercel frontend + Supabase database)
2. **Railway** ⭐⭐ - $5 free credit/month, always-on, easiest full-stack setup
3. **Fly.io** ⭐⭐ - Always-on, no credit card required
4. **Render** ⭐ - Free but services sleep after inactivity

**See `VERCEL_SUPABASE_SETUP.md` for the Vercel + Supabase combo setup guide!**

### Environment Variables

Ensure all production environment variables are properly configured:
- Database connection details (or `DATABASE_URL` for cloud)
- JWT secret key
- CORS origins
- API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software developed for Bank of Kigali.

## 👨‍💻 Author

**Steven SHYAKA**  
*Senior Software Developer*  
Bank of Kigali

---

For technical support or questions, please contact the development team.


