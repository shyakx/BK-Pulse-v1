# Reset PostgreSQL Password - Port 5434
# Run as Administrator

Write-Host "Resetting PostgreSQL Password (Port 5434)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$pgHbaFile = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Step 1: Stop service
Write-Host "Step 1: Stopping PostgreSQL..." -ForegroundColor Cyan
Stop-Service postgresql-x64-17 -Force
Start-Sleep -Seconds 3
Write-Host "  Service stopped" -ForegroundColor Green

# Step 2: Backup and modify pg_hba.conf
Write-Host "Step 2: Modifying pg_hba.conf..." -ForegroundColor Cyan
$backup = "$pgHbaFile.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $pgHbaFile $backup -Force

$content = Get-Content $pgHbaFile -Raw

# Remove existing trust lines if any
$content = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+trust", ""
$content = $content -replace "host\s+all\s+all\s+::1/128\s+trust", ""

# Add trust lines at the very beginning (after any comments)
$trustLines = @"
# Trust local connections (temporary - for password reset)
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust

"@

# Find where to insert (after header comments)
if ($content -match "^(#.*\r?\n)+") {
    $insertPos = $matches[0].Length
    $newContent = $content.Substring(0, $insertPos) + $trustLines + $content.Substring($insertPos)
} else {
    $newContent = $trustLines + $content
}

Set-Content -Path $pgHbaFile -Value $newContent -NoNewline
Write-Host "  pg_hba.conf modified" -ForegroundColor Green

# Step 3: Start service
Write-Host "Step 3: Starting PostgreSQL..." -ForegroundColor Cyan
Start-Service postgresql-x64-17
Start-Sleep -Seconds 5  # Give it more time to start
Write-Host "  Service started" -ForegroundColor Green

# Step 4: Reset password (with correct port)
Write-Host "Step 4: Resetting password..." -ForegroundColor Cyan
$newPassword = "0123"

Write-Host "  Attempting to set password to: $newPassword" -ForegroundColor Yellow

# Try with explicit port 5434
$result = & $psqlPath -h localhost -p 5434 -U postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Password reset successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Password reset failed!" -ForegroundColor Red
    Write-Host "  Error: $result" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Trying alternative method..." -ForegroundColor Cyan
    
    # Try connecting first, then running command
    $connectCmd = @"
ALTER USER postgres WITH PASSWORD '$newPassword';
"@
    $connectCmd | & $psqlPath -h localhost -p 5434 -U postgres 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Password reset successfully (alternative method)!" -ForegroundColor Green
    }
}

# Step 5: Restore security
Write-Host "Step 5: Restoring pg_hba.conf security..." -ForegroundColor Cyan
$content = Get-Content $pgHbaFile -Raw
$content = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+trust", "host    all             all             127.0.0.1/32            md5"
$content = $content -replace "host\s+all\s+all\s+::1/128\s+trust", "host    all             all             ::1/128                 md5"
Set-Content -Path $pgHbaFile -Value $content -NoNewline
Write-Host "  Security restored" -ForegroundColor Green

# Step 6: Restart service
Write-Host "Step 6: Restarting PostgreSQL..." -ForegroundColor Cyan
Restart-Service postgresql-x64-17
Start-Sleep -Seconds 3
Write-Host "  Service restarted" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Password reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Password: 0123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update pgAdmin with password: 0123" -ForegroundColor White
Write-Host "2. Update server/.env file with: DB_PASSWORD=0123" -ForegroundColor White
Write-Host "3. Test: node server\scripts\testDBConnection.js" -ForegroundColor White
Write-Host ""

