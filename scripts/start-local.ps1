# CloudScale Local Startup Script (Windows PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting CloudScale Platform Locally..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Start Backend in new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend in new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both services are launching:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
