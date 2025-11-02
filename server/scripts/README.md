# Server Scripts

This directory contains utility scripts for the BK Pulse server.

## Scripts

### `testPrediction.js`
Tests the ML prediction functionality without requiring database access.

```bash
node server/scripts/testPrediction.js
```

### `updateChurnScores.js`
Updates customer churn scores in the database using the ML model.

**Prerequisites:**
- PostgreSQL database must be running
- Database must be accessible (check `.env` configuration)
- Customer records must exist in the database

**Usage:**
```bash
node server/scripts/updateChurnScores.js [limit]
```

**Examples:**
```bash
# Update up to 100 customers (default)
node server/scripts/updateChurnScores.js

# Update up to 50 customers
node server/scripts/updateChurnScores.js 50

# Update up to 500 customers
node server/scripts/updateChurnScores.js 500
```

**What it does:**
1. Connects to the database
2. Fetches customers with outdated or missing churn scores
3. Generates predictions using the ML model
4. Updates the database with new churn scores and risk levels

**Troubleshooting:**

If you get `ECONNREFUSED` error:
1. Ensure PostgreSQL is running:
   ```bash
   # Windows (if installed as service)
   # Check Services app or run:
   net start postgresql-x64-XX
   
   # Linux/Mac
   sudo service postgresql status
   # or
   sudo systemctl status postgresql
   ```

2. Check database configuration in `server/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bk_pulse
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. Verify database exists:
   ```bash
   psql -U postgres -c "\l" | grep bk_pulse
   ```

4. Test connection manually:
   ```bash
   psql -h localhost -U postgres -d bk_pulse
   ```

