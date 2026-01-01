@echo off
:: Ensure we are running in the script's directory
cd /d "%~dp0"

echo ===================================================
echo   NEET RANK PREDICTOR - ROBUST LAUNCHER
echo ===================================================
echo   Current Dir: %CD%
echo.

:: Check folders exist
if not exist "backend" (
    echo [ERROR] 'backend' folder not found!
    echo Please make sure this file is in the 'neet-rank-predictor' folder.
    pause
    exit /b
)
if not exist "frontend" (
    echo [ERROR] 'frontend' folder not found!
    pause
    exit /b
)

echo 1. Starting Backend Server...
:: cd into backend and keep window open (/k) so errors are visible
start "NEET BACKEND (Port 5000)" cmd /k "cd backend && npm run dev"

echo 2. Starting Frontend Client...
start "NEET FRONTEND (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Launch commands sent!
echo   1. Look for two new black windows.
echo   2. If they contain Red Text, show it to the developer.
echo   3. Otherwise, wait 10s and go to http://localhost:5173
echo ===================================================
pause
