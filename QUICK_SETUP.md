# Quick Setup Guide - BK Pulse Database

## Fastest Way: Using pgAdmin (Recommended)

### 1. Register Server in pgAdmin
1. Open pgAdmin 4
2. Right-click **"Servers"** → **Register** → **Server...**
3. **General Tab**: Name = `BK Pulse`
4. **Connection Tab**:
   - Host: `localhost`
   - Port: `5434` ⚠️ **Your PostgreSQL is on port 5434, NOT 5432!**
   - Username: `postgres`
   - Password: `[your PostgreSQL password]` (or try blank/`postgres` first)
5. Click **Save**

**Note:** If password fails, see `docs/RESET_POSTGRES_PASSWORD.md` to reset it.

### 2. Create Database
1. Expand your server → Right-click **"Databases"**
2. **Create** → **Database...**
3. Database name: `bk_pulse`
4. Click **Save**

### 3. Run Schema
1. Expand `bk_pulse` → Right-click database → **Query Tool**
2. Click **Open File** (folder icon)
3. Select: `server/sql/schema.sql`
4. Click **Execute** (play icon) or press `F5`

### 4. Configure .env File
Create `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5434
DB_NAME=bk_pulse
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 5. Test
```bash
node server/scripts/testDBConnection.js
```

**Done!** ✅

For detailed instructions, see `docs/PGADMIN_SETUP_GUIDE.md`

