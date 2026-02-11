@echo off
setlocal enabledelayedexpansion
title Multi Hub - Build Portable
echo ================================================================
echo.
echo             Multi Hub - Portable Build Tool
echo.
echo ================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    echo.
    echo Node.js installation may be incomplete.
    echo.
    pause
    exit /b 1
)

echo Building portable (standalone) version...
echo.
echo This may take 2-5 minutes, please wait...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [Step 1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
      )
) else (
    echo [Step 1/3] Dependencies already installed, skipping...
)

echo.
echo [Step 2/3] Building portable EXE...
call npm run build:win

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

REM Process 'Multi Hub.exe' update
echo.
echo [Step 3/3] Updating Multi Hub.exe...

REM Get the newly built portable file name from package.json version
set VERSION=
for /f "tokens=2 delims=:," %%a in ('findstr /n /i /c:\"version\" package.json ^| findstr "^4:"') do (
    set val=%%~a
    set val=!val: =!
    set val=!val:"=!
    set VERSION=!val!
)
if "!VERSION!"=="" (
    for /f "tokens=2 delims=:," %%a in ('findstr /i /c:\"version\" package.json ^| findstr /v "artifactName"') do (
        if "!VERSION!"=="" (
            set val=%%~a
            set val=!val: =!
            set val=!val:"=!
            set VERSION=!val!
        )
    )
)
set PORTABLE_FILE=dist\Multi Hub-!VERSION!-Portable.exe

if exist "!PORTABLE_FILE!" (
    REM Check if Multi Hub.exe is running and kill it
    tasklist /FI "IMAGENAME eq Multi Hub.exe" 2>NUL | find /I /N "Multi Hub.exe">NUL
    if "!ERRORLEVEL!"=="0" (
        echo [INFO] Multi Hub.exe is running, closing it...
        taskkill /F /IM "Multi Hub.exe" /T >nul 2>&1
        timeout /t 2 /nobreak >nul
    )

    REM Update Multi Hub.exe
    echo [INFO] Updating dist\Multi Hub.exe...
    copy /Y "!PORTABLE_FILE!" "dist\Multi Hub.exe" >nul
    if errorlevel 1 (
        echo [ERROR] Failed to update Multi Hub.exe. It might be locked.
    ) else (
        echo [SUCCESS] Multi Hub.exe updated!
        
        REM Restart Multi Hub
        echo [INFO] Restarting Multi Hub...
        start "" "dist\Multi Hub.exe"
    )
) else (
    echo [WARNING] Could not find original file: !PORTABLE_FILE!
    echo [INFO] Attempting to find any Portable exe...
    for %%f in (dist\*-Portable.exe) do (
        set PORTABLE_FILE=%%f
    )
    if exist "!PORTABLE_FILE!" (
        echo [INFO] Found: !PORTABLE_FILE!
        copy /Y "!PORTABLE_FILE!" "dist\Multi Hub.exe" >nul
        start "" "dist\Multi Hub.exe"
    )
)

REM Clean up build artifacts
echo.
echo Cleaning up build artifacts...
if exist "dist\win-unpacked" rmdir /s /q "dist\win-unpacked"
if exist "dist\.icon-ico" rmdir /s /q "dist\.icon-ico"
if exist "dist\builder-debug.yml" del /q "dist\builder-debug.yml"
if exist "dist\builder-effective-config.yaml" del /q "dist\builder-effective-config.yaml"
for %%f in (dist\*.exe) do (
    set FNAME=%%~nxf
    if "!FNAME!"=="Multi Hub.exe" (
        rem keep
    ) else (
        echo !FNAME! | findstr /i "Portable" >nul
        if errorlevel 1 del /q "%%f"
    )
)
echo Done!

echo.
echo ================================================================
echo.
echo [SUCCESS] Build completed!
echo.
echo Output file: !PORTABLE_FILE!
echo Shared file: dist\Multi Hub.exe
echo.
echo ================================================================
echo.

REM Ask to open output directory
set /p opendir="Open output directory? (Y/N): "
if /i "%opendir%"=="Y" (
    start "" dist
)

echo.
pause
