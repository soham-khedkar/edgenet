# EdgeNet - Start All Services
# Runs Backend API, Python Agent API, and Frontend together

Write-Host "🚀 Starting EdgeNet Services..." -ForegroundColor Cyan
Write-Host ""

# Start Backend (Node.js/Express)
Write-Host "📦 Starting Backend API on port 4000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Python Agent API (Flask)
Write-Host "🐍 Starting Python Agent API on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agent; python api.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend (Next.js)
Write-Host "🎨 Starting Frontend on port 3000..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Backend API:    http://localhost:4000" -ForegroundColor White
Write-Host "🐍 Agent API:      http://localhost:5000" -ForegroundColor White
Write-Host "🌐 Frontend:       http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
