@echo off
title CineMind Launcher
echo ==================================================================
echo                  Starting CineMind Application
echo ==================================================================
echo.

:: 1. Check if MySQL service is running
echo [1/3] Checking MySQL Service...
sc query MySQL80 | find "RUNNING" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] MySQL80 service is active and running.
) else (
    echo [..] Attempting to start MySQL80 service...
    net start MySQL80 >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [OK] MySQL80 service started successfully.
    ) else (
        echo [INFO] MySQL80 service could not be started automatically. Backend will safely use local SQLite replica.
    )
)
echo.

:: 2. Start Python Flask Backend in a new background window
echo [2/3] Launching CineMind Backend (http://127.0.0.1:5000)...
start "CineMind Backend (Flask)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe run.py"

:: 3. Start React Vite Frontend in a new background window
echo [3/3] Launching CineMind Frontend (http://localhost:3001)...
start "CineMind Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==================================================================
echo  CineMind is launching!
echo  Backend:  http://127.0.0.1:5000
echo  Frontend: http://localhost:3001
echo ==================================================================
timeout /t 3 >nul
start http://localhost:3001
