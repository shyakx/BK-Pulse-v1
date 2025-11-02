#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bk_pulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function setupDatabase() {
  console.log('🗄️  Setting up BK Pulse database...\n');

  try {
    // Read and execute schema
    console.log('📋 Creating database schema...');
    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Database schema created');

    // Read and execute seed data
    console.log('🌱 Inserting seed data...');
    const seedPath = path.join(__dirname, 'sql', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    await pool.query(seedSQL);
    console.log('✅ Seed data inserted');

    // Verify data
    console.log('🔍 Verifying data...');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
    
    console.log(`✅ Users created: ${userCount.rows[0].count}`);
    console.log(`✅ Customers created: ${customerCount.rows[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n🔐 Default users created:');
    console.log('   - officer1@bk.rw (Retention Officer)');
    console.log('   - analyst1@bk.rw (Retention Analyst)');
    console.log('   - manager1@bk.rw (Retention Manager)');
    console.log('   - admin@bk.rw (Admin)');
    console.log('   Password for all: password123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if database exists
async function checkDatabase() {
  try {
    const adminPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres', // Connect to default postgres database
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME || 'bk_pulse']
    );

    await adminPool.end();

    if (result.rows.length === 0) {
      console.log('❌ Database "bk_pulse" does not exist.');
      console.log('Please create it first: createdb bk_pulse');
      process.exit(1);
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please check your database credentials in .env file');
    process.exit(1);
  }
}

async function main() {
  await checkDatabase();
  await setupDatabase();
}

main();

