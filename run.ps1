# Haircut Salon Development Server Restart Script
# Usage: .\run.ps1

Write-Host "=== Haircut Salon Development Server Restart ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for running Node.js processes
Write-Host "Step 1: Checking for running development servers..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Found running server processes" -ForegroundColor Green

    # Step 2: Stop existing servers
    Write-Host "Step 2: Stopping existing servers..." -ForegroundColor Yellow

    $nodeProcesses | ForEach-Object {
        Write-Host "   Stopping Node.js process: PID $($_.Id)" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "   Server processes stopped" -ForegroundColor Green
} else {
    Write-Host "   No running servers found" -ForegroundColor Blue
}

# Step 3: Wait for port cleanup
Write-Host "Step 3: Waiting for port cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   Port cleanup complete" -ForegroundColor Green

# Step 4: Verify project setup
Write-Host "Step 4: Verifying project setup..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    Write-Host "   ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the haircut-salon directory." -ForegroundColor Blue
    Write-Host ""
    Write-Host "Correct usage:" -ForegroundColor Cyan
    Write-Host "   cd haircut-salon" -ForegroundColor White
    Write-Host "   .\run.ps1" -ForegroundColor White
    exit 1
}

# Step 5: Check environment variables
if (Test-Path ".env.local") {
    Write-Host "   Environment file found (.env.local)" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Environment file missing (.env.local)" -ForegroundColor Yellow
}

# Step 6: Start new development server
Write-Host "Step 5: Starting new development server..." -ForegroundColor Yellow
Write-Host "   Running npm run dev..." -ForegroundColor Blue
Write-Host ""

# Start the development server
npm run dev

# This line will not be reached if npm run dev starts successfully
Write-Host ""
Write-Host "Development server started!" -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Cyan