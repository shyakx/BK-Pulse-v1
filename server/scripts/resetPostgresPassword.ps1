# PostgreSQL Password Reset Script
# Run as Administrator: PowerShell -ExecutionPolicy Bypass -File resetPostgresPassword.ps1

Write-Host "PostgreSQL Password Reset Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find PostgreSQL installation
$pgInstallations = Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" -ErrorAction SilentlyContinue

if (-not $pgInstallations) {
    Write-Host "ERROR: PostgreSQL installation not found in registry!" -ForegroundColor Red
    exit 1
}

$pgInstallation = $pgInstallations[0]
$dataDir = $pgInstallation.DataDirectory
$baseDir = $pgInstallation.BaseDirectory
$serviceName = "postgresql-x64-$($pgInstallation.PSChildName)"

Write-Host "Found PostgreSQL installation:" -ForegroundColor Green
Write-Host "  Version: $($pgInstallation.PSChildName)" -ForegroundColor White
Write-Host "  Data Directory: $dataDir" -ForegroundColor White
Write-Host "  Base Directory: $baseDir" -ForegroundColor White
Write-Host "  Service: $serviceName" -ForegroundColor White
Write-Host ""

$pgHbaFile = Join-Path $dataDir "pg_hba.conf"
$pgHbaBackup = "$pgHbaFile.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"

if (-not (Test-Path $pgHbaFile)) {
    Write-Host "ERROR: pg_hba.conf not found at: $pgHbaFile" -ForegroundColor Red
    exit 1
}

# Check if service exists
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "WARNING: Service '$serviceName' not found. Trying alternative service names..." -ForegroundColor Yellow
    $service = Get-Service | Where-Object {$_.Name -like "*postgres*"} | Select-Object -First 1
    if ($service) {
        $serviceName = $service.Name
        Write-Host "Found service: $serviceName" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Could not find PostgreSQL service!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Cyan
Stop-Service -Name $serviceName -Force
Start-Sleep -Seconds 2
Write-Host "  Service stopped" -ForegroundColor Green

Write-Host "Step 2: Backing up pg_hba.conf..." -ForegroundColor Cyan
Copy-Item $pgHbaFile $pgHbaBackup -Force
Write-Host "  Backup saved to: $pgHbaBackup" -ForegroundColor Green

Write-Host "Step 3: Modifying pg_hba.conf for password reset..." -ForegroundColor Cyan
$content = Get-Content $pgHbaFile -Raw

# Check if trust lines already exist
if ($content -match "127\.0\.0\.1/32.*trust") {
    Write-Host "  pg_hba.conf already has trust configuration" -ForegroundColor Yellow
} else {
    # Add trust lines at the beginning (after comments)
    $trustLines = @"

# Trust local connections (added by password reset script - REMOVE AFTER RESET!)
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust

"@
    
    # Find where to insert (after initial comments)
    if ($content -match "(#.*\r?\n)+") {
        $insertPos = $matches[0].Length
        $newContent = $content.Substring(0, $insertPos) + $trustLines + $content.Substring($insertPos)
    } else {
        $newContent = $trustLines + $content
    }
    
    Set-Content -Path $pgHbaFile -Value $newContent -NoNewline
    Write-Host "  pg_hba.conf modified" -ForegroundColor Green
}

Write-Host "Step 4: Starting PostgreSQL service..." -ForegroundColor Cyan
Start-Service -Name $serviceName
Start-Sleep -Seconds 3
Write-Host "  Service started" -ForegroundColor Green

Write-Host "Step 5: Resetting password..." -ForegroundColor Cyan
$psqlPath = Join-Path $baseDir "bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: psql.exe not found at: $psqlPath" -ForegroundColor Red
    Write-Host "Please reset password manually using Method 1 from RESET_POSTGRES_PASSWORD.md" -ForegroundColor Yellow
    exit 1
}

$newPassword = Read-Host "Enter new password for 'postgres' user"
$confirmPassword = Read-Host "Confirm password"

if ($newPassword -ne $confirmPassword) {
    Write-Host "ERROR: Passwords do not match!" -ForegroundColor Red
    # Restore backup
    Copy-Item $pgHbaBackup $pgHbaFile -Force
    Restart-Service -Name $serviceName
    exit 1
}

# Reset password
$env:PGPASSWORD = ""
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"
& $psqlPath -U postgres -c $sqlCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Password reset successfully!" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Password reset command failed. Try manually:" -ForegroundColor Yellow
    Write-Host "  $psqlPath -U postgres -c `"ALTER USER postgres WITH PASSWORD '$newPassword';`"" -ForegroundColor White
}

Write-Host "Step 6: Restoring pg_hba.conf security..." -ForegroundColor Cyan
Copy-Item $pgHbaBackup $pgHbaFile -Force
Write-Host "  Security restored" -ForegroundColor Green

Write-Host "Step 7: Restarting PostgreSQL service..." -ForegroundColor Cyan
Restart-Service -Name $serviceName
Write-Host "  Service restarted" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Password reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "New password: $newPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update server/.env file with the new password" -ForegroundColor White
Write-Host "2. Update pgAdmin connection with the new password" -ForegroundColor White
Write-Host "3. Test connection: node server/scripts/testDBConnection.js" -ForegroundColor White
Write-Host ""
Write-Host "Backup file: $pgHbaBackup" -ForegroundColor Gray
Write-Host "  (You can delete this after confirming everything works)" -ForegroundColor Gray

