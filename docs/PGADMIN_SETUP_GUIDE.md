# pgAdmin Setup Guide - BK Pulse Database

Complete guide to set up PostgreSQL database for BK Pulse using pgAdmin.

## ⚠️ IMPORTANT: Register Server BEFORE Using Query Tool

The Query Tool requires a connection. **You must register a server first** (recommended) OR use ad-hoc connection. See `docs/QUERY_TOOL_CONNECTION.md` for detailed connection instructions.

## Step 1: Register PostgreSQL Server in pgAdmin

### 1.1 Open pgAdmin
- Launch pgAdmin 4 from your Start Menu
- It should open in your web browser (usually http://127.0.0.1:XXXXX)

### 1.2 Register New Server
1. Right-click on **"Servers"** in the left sidebar
2. Select **"Register"** → **"Server..."**

### 1.3 Fill in the "General" Tab
- **Name**: `BK Pulse` (or any name you prefer)

### 1.4 Fill in the "Connection" Tab (IMPORTANT!)

Fill in these fields:

- **Host name/address**: `localhost` (or `127.0.0.1`)
- **Port**: `5434` (or check your PostgreSQL port - it might be 5432)
- **Maintenance database**: `postgres`
- **Username**: `postgres`
- **Password**: Enter the password you set when installing PostgreSQL
- **Save password?**: ✅ Check this box (optional, but convenient)

### 1.5 Save Connection
1. Click **"Save"** button at the bottom
2. If connection succeeds, you'll see the server appear in the left sidebar
3. Expand it to see the databases

## Step 2: Find Your PostgreSQL Port

If you're not sure which port PostgreSQL is using:

### Method 1: Check pgAdmin
1. Look at any existing server connections in pgAdmin
2. The port is shown in the server properties

### Method 2: Check Windows Services
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

Then check the PostgreSQL configuration files.

### Method 3: Test Common Ports
- Port 5432 (default)
- Port 5434 (common alternative)
- Port 5433 (sometimes used)

## Step 3: Create the Database

### 3.1 Open Query Tool
1. In pgAdmin, expand your server connection
2. Right-click on **"Databases"**
3. Select **"Create"** → **"Database..."**

### 3.2 Database Settings
- **Database**: `bk_pulse`
- **Owner**: `postgres` (default)
- Click **"Save"**

Alternatively, use SQL:
1. Right-click on your server → **"Query Tool"**
2. Run this SQL:
```sql
CREATE DATABASE bk_pulse;
```

## Step 4: Run Schema Script

### 4.1 Open Query Tool
1. Expand **"Databases"** → **"bk_pulse"**
2. Right-click on **"bk_pulse"** → **"Query Tool"**

### 4.2 Load and Run Schema
1. Click the **"Open File"** button (folder icon) in the Query Tool
2. Navigate to: `D:\Projects\BK-PULSE\server\sql\schema.sql`
3. Open the file
4. Click the **Execute** button (play icon) or press `F5`
5. Wait for "Query returned successfully"

### 4.3 Verify Tables Were Created
1. Expand **"bk_pulse"** → **"Schemas"** → **"public"** → **"Tables"**
2. You should see these tables:
   - `users`
   - `customers`
   - `actions`
   - `recommendations`
   - `audit_logs`
   - `model_performance`
   - `system_settings`

## Step 5: (Optional) Run Seed Data

### 5.1 Load Seed Script
1. In the Query Tool, click **"Open File"** again
2. Navigate to: `D:\Projects\BK-PULSE\server\sql\seed.sql`
3. Open the file
4. Click **Execute** or press `F5`

This will populate your database with sample data for testing.

## Step 6: Create .env File

### 6.1 Update Your .env File

Create or update `server/.env` file with your connection details:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important:**
- Replace `5434` with your actual PostgreSQL port (might be 5432)
- Replace `your_postgres_password_here` with the password you used in pgAdmin

### 6.2 Or Use Interactive Script
```bash
node server/scripts/createEnv.js
```

## Step 7: Test Connection

### 7.1 Test from Node.js
```bash
node server/scripts/testDBConnection.js
```

You should see:
```
✅ Connection successful!
✅ Database 'bk_pulse' exists
✅ Tables found:
   - actions
   - audit_logs
   - customers
   ...
```

### 7.2 Test from Command Line
```bash
psql -h localhost -p 5434 -U postgres -d bk_pulse
```

## Troubleshooting

### "Host name/address" Error
- **Solution**: Enter `localhost` or `127.0.0.1` in the Host name field

### "Password authentication failed"
- **Solution**: 
  1. Check if you're using the correct password
  2. Try resetting the password in pgAdmin: Right-click server → Properties → Connection tab
  3. If you forgot the password, you may need to reset it via pg_hba.conf

### "Connection refused"
- **Solution**: 
  1. Check if PostgreSQL service is running: `Get-Service postgresql-x64-17`
  2. Verify the port number (might be 5432 instead of 5434)
  3. Check if firewall is blocking the connection

### "Database does not exist"
- **Solution**: Follow Step 3 to create the `bk_pulse` database

### "Relation does not exist" (when running queries)
- **Solution**: Make sure you ran the schema.sql script in Step 4

## Quick Checklist

- [ ] pgAdmin installed and running
- [ ] Server registered in pgAdmin with correct credentials
- [ ] Connection successful (server shows green)
- [ ] Database `bk_pulse` created
- [ ] Schema script executed successfully
- [ ] Tables visible in pgAdmin
- [ ] `.env` file created with correct credentials
- [ ] Test connection successful from Node.js

## Next Steps

Once setup is complete:

1. **Update customer churn scores:**
   ```bash
   node server/scripts/updateChurnScores.js
   ```

2. **Start the server:**
   ```bash
   npm run server
   ```

3. **Test API endpoints:**
   - Use Postman or curl to test the prediction endpoints
   - Check `docs/PREDICTION_API.md` for API documentation

## Visual Guide

### pgAdmin Server Registration
```
Servers (Right-click) 
  → Register → Server...
  → General Tab: Name = "BK Pulse"
  → Connection Tab:
     - Host: localhost
     - Port: 5434 (or 5432)
     - Username: postgres
     - Password: [your password]
  → Save
```

### Creating Database
```
Servers → BK Pulse → Databases (Right-click)
  → Create → Database...
  → Database: bk_pulse
  → Save
```

### Running Schema
```
Databases → bk_pulse (Right-click)
  → Query Tool
  → Open File → schema.sql
  → Execute (F5)
```

