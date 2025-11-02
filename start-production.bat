@echo off
REM BK-PULSE Production Start Script for Windows

echo.
echo 🚀 Starting BK-PULSE in Production Mode
echo ========================================
echo.

REM Check if build exists
if not exist "client\build" (
    echo ⚠️  Frontend build not found. Building now...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
)

REM Set production environment
set NODE_ENV=production

REM Start server
echo.
echo 📡 Starting server...
echo.
cd server
node index.js

