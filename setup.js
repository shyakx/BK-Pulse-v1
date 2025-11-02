#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up BK Pulse - Role-based Churn Intelligence Platform\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Install root dependencies
console.log('\n📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed');
} catch (error) {
  console.error('❌ Failed to install root dependencies:', error.message);
  process.exit(1);
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('cd server && npm install', { stdio: 'inherit' });
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies:', error.message);
  process.exit(1);
}

// Install client dependencies
console.log('\n📦 Installing client dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Client dependencies installed');
} catch (error) {
  console.error('❌ Failed to install client dependencies:', error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file...');
  const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
  console.log('⚠️  Please update the database credentials in server/.env');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up PostgreSQL database:');
console.log('   createdb bk_pulse');
console.log('   psql -d bk_pulse -f server/sql/schema.sql');
console.log('   psql -d bk_pulse -f server/sql/seed.sql');
console.log('\n2. Update database credentials in server/.env');
console.log('\n3. Start the application:');
console.log('   npm run dev');
console.log('\n4. Open http://localhost:3000 in your browser');
console.log('\n🔐 Default login credentials:');
console.log('   Email: officer1@bk.rw | Password: password123');
console.log('   Email: analyst1@bk.rw | Password: password123');
console.log('   Email: manager1@bk.rw | Password: password123');
console.log('   Email: admin@bk.rw | Password: password123');
console.log('\n📚 For more information, see README.md');

