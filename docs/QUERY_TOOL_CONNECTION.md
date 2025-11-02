# How to Connect to Query Tool in pgAdmin

The Query Tool requires a connection before you can run SQL queries. Here are two ways to connect:

## Option 1: Use an Existing Server (Recommended - Do This First)

### Step 1: Register a Server First
Before using Query Tool, you need to register your PostgreSQL server:

1. In pgAdmin left sidebar, **right-click** on **"Servers"**
2. Select **"Register"** → **"Server..."**
3. Fill in the connection details:
   - **General Tab**: Name = `BK Pulse` (or any name)
   - **Connection Tab**:
     - Host: `localhost`
     - Port: `5434` (or `5432`)
     - Username: `postgres`
     - Password: `[your password]`
   - Click **"Save"**

4. The server will appear in the left sidebar. **Expand it** to see "Databases"

### Step 2: Create Database (if not exists)
1. Right-click **"Databases"** → **Create** → **Database...**
2. Name: `bk_pulse`
3. Click **"Save"**

### Step 3: Open Query Tool from Registered Server
1. **Expand** your server → **"Databases"** → **"bk_pulse"**
2. **Right-click** on **"bk_pulse"** database
3. Select **"Query Tool"**
4. **No login needed!** It uses your saved connection

### Step 4: Run Schema
1. In Query Tool, click **"Open File"** (folder icon)
2. Navigate to: `D:\Projects\BK-PULSE\server\sql\schema.sql`
3. Click **"Execute"** (play icon) or press `F5`

---

## Option 2: Ad-Hoc Connection (Direct from Query Tool)

If you haven't registered a server yet, you can connect directly:

### In the Query Tool Connection Dialog:

Fill in these fields:

1. **Server Name**: `BK Pulse` (or any name - this is just a label)
2. **Host name/address**: `localhost`
3. **Port**: `5434` (or `5432` - check your PostgreSQL port)
4. **Database**: `postgres` (to connect first, then create bk_pulse)
   - OR `bk_pulse` (if database already exists)
5. **User**: `postgres`
6. **Password**: `[your PostgreSQL password]`

7. Click **"Connect & Open Query Tool"**

### Then Create Database (if needed):
```sql
CREATE DATABASE bk_pulse;
```

Then connect again to `bk_pulse` database.

---

## Recommended Workflow

**Best approach** - Do this once:

### 1️⃣ Register Server (One-Time Setup)
```
Left Sidebar → Servers (Right-click) 
  → Register → Server...
  → Fill connection details
  → Save
```

### 2️⃣ Create Database
```
Servers → BK Pulse → Databases (Right-click)
  → Create → Database...
  → Name: bk_pulse
  → Save
```

### 3️⃣ Use Query Tool (Anytime)
```
Servers → BK Pulse → Databases → bk_pulse (Right-click)
  → Query Tool
  → Open File → schema.sql
  → Execute
```

---

## Visual Guide

### Left Sidebar Structure After Setup:
```
📁 Servers
  └─ 📡 BK Pulse (your registered server)
      └─ 📁 Databases
          └─ 💾 bk_pulse (right-click here → Query Tool)
```

---

## Troubleshooting

### "Server Name cannot be empty"
- **Solution**: Enter any name (e.g., "BK Pulse") in the Server Name field

### "Connection refused" or "Cannot connect"
- **Solution**: 
  1. Check if PostgreSQL service is running
  2. Verify port number (5432 or 5434)
  3. Check username and password

### "Password authentication failed"
- **Solution**: 
  1. Verify you're using the correct password
  2. If forgotten, you may need to reset it

### "Database does not exist"
- **Solution**: 
  1. Connect to `postgres` database first
  2. Run: `CREATE DATABASE bk_pulse;`
  3. Then reconnect to `bk_pulse` database

---

## Quick Steps Summary

**For Query Tool Connection Dialog:**
1. Server Name: `BK Pulse`
2. Host: `localhost`
3. Port: `5434` (or `5432`)
4. Database: `postgres` (first time) or `bk_pulse` (after creation)
5. User: `postgres`
6. Password: `[your password]`
7. Click **"Connect & Open Query Tool"**

**Then run your SQL queries!**

