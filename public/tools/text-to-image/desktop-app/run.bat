@echo off
cd /d "%~dp0"
set PYTHONPATH=%~dp0lib;%PYTHONPATH%
python main.py
if errorlevel 1 (
    echo.
    echo An error occurred. Please run setup.bat first.
    pause
)
