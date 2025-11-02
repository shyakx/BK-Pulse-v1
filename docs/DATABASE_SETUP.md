# Database Setup Guide

This guide helps you set up PostgreSQL for BK Pulse on Windows.

## Option 1: Start PostgreSQL Service (If Already Installed)

### Check if PostgreSQL is installed:
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

### Start PostgreSQL Service:
```powershell
# Start the service (replace with your actual service name)
Start-Service postgresql-x64-XX  # Replace XX with version number

# Or using net command
net start postgresql-x64-XX

# Check status
Get-Service postgresql-x64-XX
```

### Common PostgreSQL Service Names:
- `postgresql-x64-13`
- `postgresql-x64-14`
- `postgresql-x64-15`
- `postgresql-x64-16`

## Option 2: Install PostgreSQL

### Download and Install:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Note the port (default is 5432)
5. Complete the installation

### After Installation:
```bash
# Create the database
createdb -U postgres bk_pulse

# Or using psql
psql -U postgres
CREATE DATABASE bk_pulse;
\q

# Run schema
psql -U postgres -d bk_pulse -f server/sql/schema.sql

# Run seed data (optional)
psql -U postgres -d bk_pulse -f server/sql/seed.sql
```

## Option 3: Use Docker (Recommended for Development)

### Install Docker Desktop:
1. Download from: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop

### Run PostgreSQL in Docker:
```bash
docker run --name bk-pulse-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bk_pulse \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds, then run schema
psql -h localhost -U postgres -d bk_pulse -f server/sql/schema.sql
```

### Using docker-compose (Alternative):
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bk_pulse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Then run:
```bash
docker-compose up -d
```

## Option 4: Use SQLite (For Quick Testing)

If you just want to test the ML predictions without setting up PostgreSQL, you can modify the scripts to skip database operations. However, the current implementation requires PostgreSQL.

## Verify Installation

### Test Connection:
```bash
psql -U postgres -d bk_pulse -c "SELECT version();"
```

### Check if database exists:
```bash
psql -U postgres -l | grep bk_pulse
```

## Configure Environment Variables

### Option 1: Interactive Setup (Recommended)
```bash
node server/scripts/createEnv.js
```
This will guide you through creating the `.env` file step by step.

### Option 2: Manual Setup

Create `server/.env` file manually:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important:** 
- Replace `your_actual_postgres_password_here` with the password you set when installing PostgreSQL
- If you forgot the password, you can reset it or check pgAdmin
- Default port might be 5434 instead of 5432 (check your PostgreSQL installation)

## Troubleshooting

### Connection Refused:
- Ensure PostgreSQL service is running
- Check if port 5432 is not blocked by firewall
- Verify connection settings in `.env` file

### Authentication Failed:
- Check username and password in `.env`
- On Windows, you might need to use `postgres` as the default user

### Database Not Found:
- Create the database: `createdb -U postgres bk_pulse`
- Or: `psql -U postgres -c "CREATE DATABASE bk_pulse;"`

### Permission Denied:
- Ensure the database user has proper permissions
- Try using the `postgres` superuser for initial setup

## Next Steps

Once PostgreSQL is running:
1. Create the database
2. Run the schema: `psql -U postgres -d bk_pulse -f server/sql/schema.sql`
3. (Optional) Run seed data: `psql -U postgres -d bk_pulse -f server/sql/seed.sql`
4. Update `server/.env` with your database credentials
5. Test the connection: `node server/scripts/updateChurnScores.js`

## Quick Start Checklist

- [ ] PostgreSQL installed or Docker running
- [ ] PostgreSQL service started (if using Windows installer)
- [ ] Database `bk_pulse` created
- [ ] Schema file executed (`server/sql/schema.sql`)
- [ ] `server/.env` file created with database credentials
- [ ] Connection tested successfully

