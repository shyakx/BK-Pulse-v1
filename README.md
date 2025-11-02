# BK Pulse - Role-based Churn Intelligence Platform

A comprehensive churn intelligence platform built for Bank of Kigali, featuring role-based access control and advanced analytics capabilities.

## 🏦 Overview

BK Pulse is a sophisticated platform designed to help Bank of Kigali identify, analyze, and prevent customer churn through data-driven insights and targeted retention strategies.

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

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd BK-PULSE

# Install all dependencies
npm run install-all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb bk_pulse

# Run schema and seed data
psql -d bk_pulse -f server/sql/schema.sql
psql -d bk_pulse -f server/sql/seed.sql
```

### 3. Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bk_pulse
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server    # Backend only
npm run client    # Frontend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Retention Officer | officer1@bk.rw | password123 |
| Retention Analyst | analyst1@bk.rw | password123 |
| Retention Manager | manager1@bk.rw | password123 |
| Admin | admin@bk.rw | password123 |

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

