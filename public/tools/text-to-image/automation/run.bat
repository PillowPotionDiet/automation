@echo off
echo ========================================
echo   Text-to-Image Automation
echo   Using Google Flow (ImageFX)
echo ========================================
echo.

REM Check if config.json exists
if not exist "config.json" (
    echo ERROR: config.json not found!
    echo.
    echo Please create config.json from config.template.json:
    echo   1. Copy config.template.json to config.json
    echo   2. Edit config.json with your Google credentials
    echo   3. Add your prompts
    echo.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please run setup.bat first
    echo.
    pause
    exit /b 1
)

echo Starting browser automation...
echo.
echo NOTE: If 2FA is enabled, you may need to complete it manually.
echo       The browser will pause for you to do this.
echo.
echo Target: Google Flow ImageFX
echo.

python automation.py

echo.
echo ========================================
echo   Generation Complete!
echo ========================================
echo.
echo Check the output/images folder for your generated images.
echo.
pause
