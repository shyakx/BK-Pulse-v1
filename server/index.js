const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// CORS Configuration - Support multiple origins (comma-separated) or single origin
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/retention-notes', require('./routes/retentionNotes'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/segmentation', require('./routes/segmentation'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/team', require('./routes/team'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static files from React app (if build exists)
const path = require('path');
const fs = require('fs');
const buildPath = path.join(__dirname, '../client/build/index.html');

if (fs.existsSync(buildPath)) {
  console.log('✅ Found React build, serving static files...');
  // Serve static files from React app
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing - return all non-API requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  console.log('⚠️  React build not found. Run: npm run build');
  // 404 handler for development (API routes only)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ message: 'API route not found' });
    } else {
      res.status(404).json({ message: 'Frontend not built. Run: npm run build' });
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BK Pulse Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

module.exports = app;

