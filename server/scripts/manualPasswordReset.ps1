# Manual Password Reset - Quick Script
# Run as Administrator

Write-Host "Manual PostgreSQL Password Reset" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL
$psqlPath = $null
$dataDir = $null

# Try common locations
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        $dataDir = Split-Path (Split-Path (Split-Path $path))
        Write-Host "Found PostgreSQL at: $dataDir" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: Could not find psql.exe" -ForegroundColor Red
    Write-Host "Please find your PostgreSQL installation manually" -ForegroundColor Yellow
    exit 1
}

$pgHbaFile = Join-Path $dataDir "data\pg_hba.conf"

if (-not (Test-Path $pgHbaFile)) {
    Write-Host "ERROR: pg_hba.conf not found at: $pgHbaFile" -ForegroundColor Red
    exit 1
}

Write-Host "pg_hba.conf found: $pgHbaFile" -ForegroundColor Green
Write-Host ""

# Step 1: Stop service
Write-Host "Step 1: Stopping PostgreSQL..." -ForegroundColor Cyan
Stop-Service postgresql-x64-17 -Force
Start-Sleep -Seconds 2

# Step 2: Backup pg_hba.conf
Write-Host "Step 2: Backing up pg_hba.conf..." -ForegroundColor Cyan
$backup = "$pgHbaFile.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $pgHbaFile $backup -Force

# Step 3: Modify pg_hba.conf
Write-Host "Step 3: Modifying pg_hba.conf..." -ForegroundColor Cyan
$content = Get-Content $pgHbaFile -Raw

# Add trust lines at the beginning
$trustLines = @"
# Trust local connections (temporary - added by script)
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust

"@

if ($content -notmatch "127\.0\.0\.1/32.*trust") {
    if ($content -match "(#.*\r?\n)+") {
        $insertPos = $matches[0].Length
        $newContent = $content.Substring(0, $insertPos) + $trustLines + $content.Substring($insertPos)
    } else {
        $newContent = $trustLines + $content
    }
    Set-Content -Path $pgHbaFile -Value $newContent -NoNewline
}

# Step 4: Start service
Write-Host "Step 4: Starting PostgreSQL..." -ForegroundColor Cyan
Start-Service postgresql-x64-17
Start-Sleep -Seconds 3

# Step 5: Reset password
Write-Host "Step 5: Resetting password..." -ForegroundColor Cyan
$newPassword = Read-Host "Enter new password for 'postgres' user"
$confirmPassword = Read-Host "Confirm password"

if ($newPassword -ne $confirmPassword) {
    Write-Host "ERROR: Passwords do not match!" -ForegroundColor Red
    Copy-Item $backup $pgHbaFile -Force
    Start-Service postgresql-x64-17
    exit 1
}

$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"
& $psqlPath -U postgres -c $sqlCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "Password reset successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Command may have failed. Check manually:" -ForegroundColor Yellow
    Write-Host "$psqlPath -U postgres -c `"ALTER USER postgres WITH PASSWORD '$newPassword';`"" -ForegroundColor White
}

# Step 6: Restore pg_hba.conf
Write-Host "Step 6: Restoring security..." -ForegroundColor Cyan
Copy-Item $backup $pgHbaFile -Force

# Step 7: Restart service
Write-Host "Step 7: Restarting PostgreSQL..." -ForegroundColor Cyan
Restart-Service postgresql-x64-17

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Password reset complete!" -ForegroundColor Green
Write-Host "New password: $newPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Update your .env file and pgAdmin with this password!" -ForegroundColor Cyan

