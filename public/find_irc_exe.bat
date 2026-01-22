@echo off
echo ========================================
echo Finding IRC Gateway Executable
echo ========================================
echo.

echo Checking Desktop\kiwiirc-master...
cd /d "C:\Users\dunad\Desktop\kiwiirc-master" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Folder kiwiirc-master not found on Desktop
) else (
    echo Current folder: %CD%
    echo.
    echo EXE files found:
    dir /b *.exe 2>nul
    if %ERRORLEVEL% neq 0 echo   (none)
)

echo.
echo ----------------------------------------
echo Checking Desktop directly...
cd /d "C:\Users\dunad\Desktop" 2>nul
echo EXE files on Desktop:
dir /b *webircgateway*.exe 2>nul
if %ERRORLEVEL% neq 0 echo   (none)

echo.
echo ----------------------------------------
echo Checking Downloads folder...
cd /d "C:\Users\dunad\Downloads" 2>nul
echo EXE files in Downloads:
dir /b *webircgateway*.exe 2>nul
if %ERRORLEVEL% neq 0 echo   (none)

echo.
echo ========================================
echo Copy the EXACT filename from above
echo and tell me what it says
echo ========================================
pause
