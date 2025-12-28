@echo off
echo ============================================
echo   Text-to-Image Desktop App Setup
echo ============================================
echo.

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

REM Check if using Microsoft Store Python (has long path issues)
python -c "import sys; exit(0 if 'WindowsApps' in sys.executable else 1)" 2>nul
if not errorlevel 1 (
    echo ============================================
    echo   IMPORTANT: Microsoft Store Python Detected
    echo ============================================
    echo.
    echo You are using Microsoft Store Python which has
    echo Windows Long Path issues.
    echo.
    echo Please enable Long Paths in Windows:
    echo.
    echo 1. Press Win + R, type: regedit
    echo 2. Navigate to:
    echo    HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem
    echo 3. Set "LongPathsEnabled" to 1
    echo 4. Restart your computer
    echo.
    echo OR install Python from python.org instead:
    echo    https://python.org/downloads
    echo.
    echo After fixing, run this setup again.
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
pip install --no-cache-dir -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install some dependencies.
    echo.
    echo If you see "Windows Long Path" error:
    echo 1. Enable Long Paths in Windows Registry
    echo 2. Or install Python from python.org
    echo.
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
