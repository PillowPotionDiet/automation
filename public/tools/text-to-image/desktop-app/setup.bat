@echo off
echo ============================================
echo   Text-to-Image Desktop App Setup
echo ============================================
echo.

REM Set short temp directory to avoid Windows Long Path issues
set TMPDIR=%~d0\tmp
set TEMP=%~d0\tmp
set TMP=%~d0\tmp
if not exist "%TMPDIR%" mkdir "%TMPDIR%"

REM Clear pip cache to avoid long path issues
echo Clearing pip cache...
pip cache purge >nul 2>&1

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8+ from:
    echo   https://python.org/downloads
    echo.
    echo Make sure to check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

echo Python found!
python --version
echo.

echo Installing dependencies...
echo (Using short temp path to avoid Windows Long Path issues)
echo.
pip install --no-cache-dir --target="%~dp0lib" -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install some dependencies.
    echo Please try running: pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo You can now run the app using: python main.py
echo Or double-click run.bat
echo.
pause
