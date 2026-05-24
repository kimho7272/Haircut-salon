# Quick server restart script

Write-Host "Restarting server..." -ForegroundColor Cyan

# Kill all Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev