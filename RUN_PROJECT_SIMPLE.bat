@echo off
cd /d "%~dp0"
echo Starting servers...

cd backend
start "Backend" cmd /k "npm run dev"
cd ..

cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo Done. Check the new windows.
