@echo off
echo ========================================
echo   Text-to-Image Automation Setup
echo   Using Google Flow (ImageFX)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Python found. Installing dependencies...
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install some dependencies
    echo Try running as Administrator or check your internet connection
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Copy config.template.json to config.json
echo   2. Edit config.json with your Google credentials
echo   3. Add your image prompts to config.json
echo   4. Run run.bat to start generation
echo.
echo IMPORTANT: Keep your config.json private!
echo.
pause
