# How to Reset PostgreSQL Password on Windows

If you forgot your PostgreSQL password, here's how to reset it.

## Method 1: Reset Password via pg_hba.conf (Easiest)

### Step 1: Stop PostgreSQL Service
```powershell
Stop-Service postgresql-x64-17
```
Or use Services app:
1. Press `Win + R`, type `services.msc`
2. Find "postgresql-x64-17"
3. Right-click → Stop

### Step 2: Find PostgreSQL Data Directory
```powershell
Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" | Select-Object PSChildName, DataDirectory
```

Or check common locations:
- `C:\Program Files\PostgreSQL\17\data`
- `C:\ProgramData\PostgreSQL\17\data`

### Step 3: Edit pg_hba.conf
1. Navigate to the data directory
2. Open `pg_hba.conf` in a text editor (as Administrator)
3. Find lines starting with `# TYPE  DATABASE...` at the top
4. Add or modify these lines at the **top** (before other rules):

```
# Trust local connections (temporary)
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

5. Save the file

### Step 4: Start PostgreSQL Service
```powershell
Start-Service postgresql-x64-17
```

### Step 5: Reset Password (No Password Required)
```powershell
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_new_password';"
```

Or connect and change it:
```powershell
psql -U postgres
```

Then in psql:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

### Step 6: Restore pg_hba.conf Security
1. Edit `pg_hba.conf` again
2. Change the lines back to:
```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```
3. Save and restart service:
```powershell
Restart-Service postgresql-x64-17
```

### Step 7: Test New Password
```powershell
psql -U postgres -W
# Enter your new password when prompted
```

---

## Method 2: Using pgAdmin (If Already Connected)

If you can still access pgAdmin:

1. In pgAdmin, right-click on your server
2. Select **"Properties"**
3. Go to **"Connection"** tab
4. Change the password in the password field
5. Check **"Save password"**
6. Click **"Save"**

However, this only saves it in pgAdmin, it doesn't actually change the PostgreSQL user password.

---

## Method 3: Reset via Windows Service Account

### Step 1: Find Service Account
```powershell
Get-WmiObject win32_service | Where-Object {$_.Name -like "*postgres*"} | Select-Object Name, StartName
```

### Step 2: Reset Using Service Account
If PostgreSQL runs as a Windows user account, you might be able to connect as that user.

---

## Method 4: Using initdb Script (Last Resort)

If nothing else works, you can reinitialize PostgreSQL (⚠️ **WARNING: This will delete all data**):

1. **BACKUP YOUR DATA FIRST!** (if you have any)
2. Stop the service
3. Rename or backup the data directory
4. Reinitialize:
```powershell
cd "C:\Program Files\PostgreSQL\17\bin"
.\initdb.exe -D "C:\ProgramData\PostgreSQL\17\data"
```

This is destructive and should be a last resort!

---

## Method 5: Use Default/Common Passwords

Try these common default passwords:
- `postgres`
- `admin`
- `password`
- `root`
- (empty/blank)

Some installations might have a default password or allow blank passwords for local connections.

---

## Quick Reset Script (PowerShell)

Save this as `reset_postgres_password.psl` and run as Administrator:

```powershell
# Stop PostgreSQL
Stop-Service postgresql-x64-17

# Find data directory
$dataDir = (Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*").DataDirectory
$pgHbaFile = Join-Path $dataDir "pg_hba.conf"

# Backup original
Copy-Item $pgHbaFile "$pgHbaFile.backup"

# Add trust lines
$trustLines = @"
host    all             all             127.0.0.1/32            trust`r`n
host    all             all             ::1/128                 trust`r`n
"@

$content = Get-Content $pgHbaFile
$newContent = $trustLines + ($content | Out-String)
Set-Content $pgHbaFile $newContent

# Start service
Start-Service postgresql-x64-17

# Set new password
$newPassword = Read-Host "Enter new password for postgres user"
$env:PGPASSWORD = ""
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"

# Restore security
$content = Get-Content "$pgHbaFile.backup"
Set-Content $pgHbaFile $content
Restart-Service postgresql-x64-17

Write-Host "Password reset complete!"
```

---

## Recommended: Method 1 (pg_hba.conf)

**Easiest and safest approach:**

1. Stop PostgreSQL service
2. Edit `pg_hba.conf` to use `trust` instead of `md5`
3. Start service
4. Reset password without password requirement
5. Restore `pg_hba.conf` security
6. Restart service

---

## After Resetting Password

1. **Update your `.env` file:**
   ```env
   DB_PASSWORD=your_new_password
   ```

2. **Update pgAdmin connection:**
   - Right-click server → Properties → Connection tab
   - Update password and save

3. **Test connection:**
   ```bash
   psql -h localhost -U postgres -d bk_pulse
   ```

---

## Need Help?

If you're stuck:
1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\17\data\log\`
2. Verify service is running: `Get-Service postgresql-x64-17`
3. Check port: `netstat -an | findstr 5432` or `netstat -an | findstr 5434`

