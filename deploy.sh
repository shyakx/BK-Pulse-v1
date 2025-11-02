#!/bin/bash

# BK-PULSE Deployment Script
# For Academic Capstone Project

echo "🚀 BK-PULSE Deployment Script"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env not found"
    echo "   Please create server/.env with required environment variables"
    echo "   See server/env.example for reference"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Build frontend
echo ""
echo "🏗️  Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Check database connection
echo ""
echo "🔍 Checking database connection..."
cd server
node -e "
const pool = require('./config/database');
pool.query('SELECT 1')
    .then(() => {
        console.log('✅ Database connection successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('   Please check your database configuration in .env');
        process.exit(1);
    });
"

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Database check failed. Continuing anyway..."
fi

cd ..

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the server: npm start"
echo "   2. Or run in development: npm run dev"
echo ""
echo "🔗 Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - Health Check: http://localhost:5000/api/health"
echo ""

