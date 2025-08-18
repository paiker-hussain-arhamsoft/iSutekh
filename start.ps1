# Nature Republic Ecommerce Website Startup Script for Windows
Write-Host "Nature Republic Ecommerce Website Startup Script" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python is not installed. Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if pip is installed
try {
    $pipVersion = pip --version
    Write-Host "pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "pip is not installed. Please install pip first." -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites check passed!" -ForegroundColor Green

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location node-backend
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "Node.js dependencies already installed" -ForegroundColor Green
}
Set-Location ..

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location python-backend
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment (Windows)
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location ..

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start Node.js backend in background
Write-Host "Starting Node.js backend (port 3000)..." -ForegroundColor Yellow
Set-Location node-backend
Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c", "npm start"
Set-Location ..

# Start Python backend in background
Write-Host "Starting Python backend (port 5000)..." -ForegroundColor Yellow
Set-Location python-backend
Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c", ".\venv\Scripts\activate.bat && python app.py"
Set-Location ..

# Wait a moment for servers to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Node.js API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Python API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:8080/admin.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@naturerepublic.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Start a simple HTTP server for the frontend
Write-Host "Starting frontend server (port 8080)..." -ForegroundColor Yellow
Set-Location frontend
Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c", "python -m http.server 8080"
Set-Location ..

Write-Host ""
Write-Host "All services are now running!" -ForegroundColor Green
Write-Host "Open your browser and navigate to: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, close this PowerShell window or press Ctrl+C" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Red
    Write-Host "Servers stopped" -ForegroundColor Green
}
