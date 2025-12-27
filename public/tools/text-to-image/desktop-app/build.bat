@echo off
echo ============================================
echo   Text-to-Image Desktop App Builder
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "main.py" (
    echo ERROR: main.py not found. Please run this from the desktop-app directory.
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Cleaning previous builds...
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist
if exist "*.spec" del /q *.spec

echo.
echo [3/4] Building executable...
pyinstaller --noconfirm --onefile --windowed ^
    --name "TextToImage" ^
    --add-data "app;app" ^
    --add-data "automation;automation" ^
    --hidden-import "customtkinter" ^
    --hidden-import "PIL._tkinter_finder" ^
    --hidden-import "cryptography" ^
    --collect-all "customtkinter" ^
    main.py

if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Creating distribution package...

REM Create distribution folder
set VERSION=1.0.0
set DIST_NAME=TextToImage-v%VERSION%
if exist "dist\%DIST_NAME%" rmdir /s /q "dist\%DIST_NAME%"
mkdir "dist\%DIST_NAME%"

REM Copy files
copy "dist\TextToImage.exe" "dist\%DIST_NAME%\"
copy "README.md" "dist\%DIST_NAME%\" 2>nul

REM Create ZIP
echo Creating ZIP archive...
powershell -Command "Compress-Archive -Path 'dist\%DIST_NAME%\*' -DestinationPath 'dist\%DIST_NAME%-Windows.zip' -Force"

echo.
echo ============================================
echo   BUILD COMPLETE!
echo ============================================
echo.
echo Output files:
echo   - dist\TextToImage.exe
echo   - dist\%DIST_NAME%-Windows.zip
echo.
echo You can distribute the ZIP file to users.
echo.
pause
