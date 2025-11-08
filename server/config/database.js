const { Pool } = require('pg');
const path = require('path');
// Load .env from server directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Support both DATABASE_URL (for cloud hosting) and individual credentials
const isDevelopment = process.env.NODE_ENV !== 'production';
const maxConnections = isDevelopment ? 5 : 20; // Fewer connections in dev for faster startup

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
      max: maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'bk_pulse',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

// Test the connection (only log once in development)
let connectionLogged = false;
pool.on('connect', () => {
  if (!connectionLogged && isDevelopment) {
    console.log('✓ Database connected');
    connectionLogged = true;
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

