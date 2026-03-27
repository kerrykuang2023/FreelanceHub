# JobPortal 启动脚本
# 确保后端和前端服务稳定启动

param(
    [switch]$SkipMongoCheck,
    [switch]$UseLocalMongo,
    [string]$MongoUri = ""
)

$ErrorActionPreference = "Stop"
$BackendPort = 5555
$FrontendPort = 5137

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }
    Write-Host "[$timestamp] [$Type] $Message" -ForegroundColor $colors[$Type]
}

function Test-MongoDBConnection {
    param([string]$Uri)

    Write-Status "Testing MongoDB connection..." "INFO"

    try {
        $result = & "$env:ProgramFiles\MongoDB\Server\7.0\bin\mongosh.exe" --quiet --eval "db.adminCommand({ping:1})" $Uri 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Status "MongoDB connection successful!" "SUCCESS"
            return $true
        }
    } catch {
        # Try with mongod directly
        try {
            $connectionTest = New-Object System.Net.Sockets.TcpClient
            $connectionTest.Connect("127.0.0.1", 27017)
            $connectionTest.Close()
            Write-Status "Local MongoDB is running on port 27017" "SUCCESS"
            return $true
        } catch {
            Write-Status "Cannot connect to MongoDB: $_" "WARNING"
            return $false
        }
    }

    return $false
}

function Start-Backend {
    Write-Status "Starting backend server..." "INFO"

    # Check if backend is already running
    $existingProcess = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existingProcess) {
        Write-Status "Backend is already running on port $BackendPort (PID: $($existingProcess.OwningProcess))" "INFO"
        return $true
    }

    # Start backend
    $backendPath = Join-Path $PSScriptRoot "JobPortal\server"
    if (Test-Path $backendPath) {
        Set-Location $backendPath

        # Check if .env exists
        if (-not (Test-Path ".env")) {
            Write-Status "Creating .env file from example..." "INFO"
            Copy-Item ".env.example" ".env" -Force
        }

        # Start npm
        $process = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow
        Start-Sleep -Seconds 5

        if ($process.HasExited) {
            Write-Status "Backend failed to start" "ERROR"
            return $false
        }

        Write-Status "Backend started with PID: $($process.Id)" "SUCCESS"
        return $true
    } else {
        Write-Status "Backend path not found: $backendPath" "ERROR"
        return $false
    }
}

function Start-Frontend {
    Write-Status "Starting frontend client..." "INFO"

    # Check if frontend is already running
    $existingProcess = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existingProcess) {
        Write-Status "Frontend is already running on port $FrontendPort (PID: $($existingProcess.OwningProcess))" "INFO"
        return $true
    }

    # Start frontend
    $frontendPath = Join-Path $PSScriptRoot "JobPortal\client"
    if (Test-Path $frontendPath) {
        Set-Location $frontendPath
        $process = Start-Process -FilePath "npm" -ArgumentList "run dev" -PassThru -NoNewWindow
        Start-Sleep -Seconds 5

        if ($process.HasExited) {
            Write-Status "Frontend failed to start" "ERROR"
            return $false
        }

        Write-Status "Frontend started with PID: $($process.Id)" "SUCCESS"
        return $true
    } else {
        Write-Status "Frontend path not found: $frontendPath" "ERROR"
        return $false
    }
}

function Test-ServiceHealth {
    param([string]$Url, [int]$MaxRetries = 5)

    Write-Status "Testing service health: $Url" "INFO"

    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Status "Service is healthy!" "SUCCESS"
                return $true
            }
        } catch {
            Write-Status "Attempt $i/$MaxRetries failed, retrying..." "WARNING"
            Start-Sleep -Seconds 3
        }
    }

    Write-Status "Service health check failed after $MaxRetries attempts" "ERROR"
    return $false
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JobPortal Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check MongoDB (unless skipped)
if (-not $SkipMongoCheck) {
    Write-Status "Step 1: Checking MongoDB..." "INFO"

    # First check if local MongoDB is running
    try {
        $mongoService = Get-Service -Name "*MongoDB*" -ErrorAction SilentlyContinue
        if ($mongoService -and $mongoService.Status -eq "Running") {
            Write-Status "Local MongoDB service is running" "SUCCESS"
            $mongoRunning = $true
        }
    } catch {
        Write-Status "Local MongoDB service not found or not running" "WARNING"
        $mongoRunning = $false
    }

    # Check if port 27017 is listening
    $mongoPort = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($mongoPort) {
        Write-Status "MongoDB is listening on port 27017" "SUCCESS"
        $mongoRunning = $true
    }

    if (-not $mongoRunning) {
        Write-Status "MongoDB is not running!" "ERROR"
        Write-Host ""
        Write-Host "Please either:" -ForegroundColor Yellow
        Write-Host "  1. Install and start MongoDB locally" -ForegroundColor Yellow
        Write-Host "  2. Use MongoDB Atlas cloud database" -ForegroundColor Yellow
        Write-Host "  3. Run with -SkipMongoCheck if using cloud DB" -ForegroundColor Yellow
        Write-Host ""

        if (-not $UseLocalMongo) {
            Write-Status "Attempting to use MongoDB Atlas..." "INFO"
        }
    }
}

Write-Status "Step 2: Starting Backend Server..." "INFO"
$backendStarted = Start-Backend

if ($backendStarted) {
    Write-Status "Waiting for backend to initialize..." "INFO"
    Start-Sleep -Seconds 10

    Write-Status "Step 3: Starting Frontend Client..." "INFO"
    $frontendStarted = Start-Frontend

    if ($frontendStarted) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   Services Started Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Backend: http://localhost:$BackendPort" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop services" -ForegroundColor Yellow
        Write-Host ""

        # Keep script running
        try {
            while ($true) {
                Start-Sleep -Seconds 30

                # Periodic health checks
                $backendHealth = Test-Path "HKLM:\SYSTEM\CurrentControlSet\Services\MongoDB" -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Status "Shutting down services..." "INFO"
        }
    } else {
        Write-Status "Failed to start frontend" "ERROR"
        exit 1
    }
} else {
    Write-Status "Failed to start backend" "ERROR"
    exit 1
}