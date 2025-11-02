/**
 * Helper script to create .env file interactively
 * Run with: node server/scripts/createEnv.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createEnvFile() {
  console.log('BK Pulse - Environment Configuration\n');
  console.log('Please provide your PostgreSQL credentials:\n');

  const dbHost = await question('Database Host [localhost]: ') || 'localhost';
  const dbPort = await question('Database Port [5434]: ') || '5434';
  const dbName = await question('Database Name [bk_pulse]: ') || 'bk_pulse';
  const dbUser = await question('Database User [postgres]: ') || 'postgres';
  const dbPassword = await question('Database Password: ');
  
  if (!dbPassword) {
    console.error('\n❌ Password is required!');
    rl.close();
    process.exit(1);
  }

  const jwtSecret = await question('JWT Secret [default-secret-change-in-production]: ') || 'default-secret-change-in-production';
  const port = await question('Server Port [5000]: ') || '5000';
  const corsOrigin = await question('CORS Origin [http://localhost:3000]: ') || 'http://localhost:3000';

  const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d

# Server Configuration
PORT=${port}
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=${corsOrigin}
`;

  const envPath = path.join(__dirname, '../.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Environment file created: ${envPath}`);
    console.log('\nYou can now test the connection:');
    console.log('  node server/scripts/testDBConnection.js');
    rl.close();
  } catch (error) {
    console.error(`\n❌ Failed to create .env file: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

createEnvFile();

