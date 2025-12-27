@echo off
echo ========================================
echo   Building Text-to-Image Desktop App
echo ========================================
echo.

REM Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

echo Building executable...
echo.

pyinstaller --onefile --windowed --name "TextToImage" --icon "icon.ico" app.py

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo The executable is in: dist\TextToImage.exe
echo.
pause
