@echo off
REM BK-PULSE Deployment Script for Windows
REM For Academic Capstone Project

echo.
echo 🚀 BK-PULSE Deployment Script
echo ================================
echo.

REM Check if .env exists
if not exist "server\.env" (
    echo ⚠️  Warning: server\.env not found
    echo    Please create server\.env with required environment variables
    echo    See server\env.example for reference
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Dependency installation failed!
    pause
    exit /b 1
)

REM Build frontend
echo.
echo 🏗️  Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)
echo ✅ Frontend build successful!

REM Check database connection (optional)
echo.
echo 🔍 Checking database connection...
cd server
node -e "const pool = require('./config/database'); pool.query('SELECT 1').then(() => { console.log('✅ Database connection successful'); process.exit(0); }).catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });"
cd ..

echo.
echo ✅ Deployment preparation complete!
echo.
echo 📋 Next steps:
echo    1. Start the server: npm start
echo    2. Or run in development: npm run dev
echo.
echo 🔗 Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo    - Health Check: http://localhost:5000/api/health
echo.
pause

