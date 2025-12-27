@echo off
cd /d "%~dp0"
python main.py
if errorlevel 1 (
    echo.
    echo An error occurred. Please run setup.bat first.
    pause
)
