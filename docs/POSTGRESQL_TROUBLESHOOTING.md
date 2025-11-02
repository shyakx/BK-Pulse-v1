# PostgreSQL Connection Troubleshooting

## Issue: Connection Refused on Port 5432

Even though the PostgreSQL service is running, you're getting connection refused errors. Here are solutions:

## Solution 1: Check PostgreSQL is Listening on TCP/IP

### Find PostgreSQL Data Directory:
```powershell
# Check where PostgreSQL is installed
Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" | Select-Object PSChildName, DataDirectory, BaseDirectory
```

### Check postgresql.conf:
Open `data/postgresql.conf` and ensure:
```ini
listen_addresses = 'localhost'  # or '*' to listen on all addresses
port = 5432
```

### Check pg_hba.conf:
Open `data/pg_hba.conf` and ensure local connections are allowed:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

After editing, restart the service:
```powershell
Restart-Service postgresql-x64-17
```

## Solution 2: Connect Using Socket (Alternative)

If TCP/IP isn't working, try using the socket connection:

```powershell
# Find the socket path
$pgPath = (Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*").BaseDirectory
$socketPath = "$pgPath\data"

# Or try connecting with explicit host
psql -h localhost -p 5432 -U postgres -d postgres
```

## Solution 3: Use pgAdmin or DBeaver

Instead of command line, use a GUI tool:
1. **pgAdmin** (comes with PostgreSQL installer)
2. **DBeaver** (free, cross-platform): https://dbeaver.io/

## Solution 4: Check Firewall

Windows Firewall might be blocking the connection:
```powershell
# Check firewall rules for PostgreSQL
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*postgres*"}

# If needed, create a rule (run as Administrator)
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

## Solution 5: Restart PostgreSQL Service

```powershell
# Restart the service
Restart-Service postgresql-x64-17

# Check status
Get-Service postgresql-x64-17
```

## Solution 6: Use Docker Instead (Easiest)

If you continue having issues, use Docker:

```bash
# Stop local PostgreSQL (optional)
Stop-Service postgresql-x64-17

# Run PostgreSQL in Docker
docker run --name bk-pulse-db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=bk_pulse `
  -p 5432:5432 `
  -d postgres:15

# Test connection
psql -h localhost -U postgres -d bk_pulse
# Password: postgres
```

## Quick Test Commands

### Test if port is open:
```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

### Test connection with different methods:
```powershell
# Method 1: Default
psql -U postgres

# Method 2: Explicit host
psql -h localhost -U postgres

# Method 3: Explicit host and port
psql -h localhost -p 5432 -U postgres

# Method 4: With database
psql -h localhost -U postgres -d postgres
```

## For Now: Skip Database Setup

If you just want to test ML predictions without the database:

1. The ML predictions work without database (tested successfully!)
2. You can use the API endpoints that don't require database
3. Set up the database later when needed

The prediction API works independently - you can still use:
- `POST /api/predictions/single` - for single predictions
- Test the prediction functionality by making a prediction request through the API ✅

