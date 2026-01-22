@echo off
cd /d "C:\Users\dunad\Desktop\kiwiirc-master"
echo ========================================
echo IRC Gateway Proxy
echo ========================================
echo.

if not exist "webircgateway_windows_amd64.exe" (
    echo [ERROR] webircgateway_windows_amd64.exe not found!
    echo.
    echo Download from: https://github.com/kiwiirc/webircgateway/releases
    echo Save to: %CD%
    echo.
    pause
    exit /b 1
)

echo Starting proxy on 127.0.0.1:6667
echo.
echo mIRC Settings:
echo   Server: 127.0.0.1
echo   Port: 6667  
echo   Password: your-email@example.com:your-password
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

webircgateway_windows_amd64.exe -config config.conf

echo.
echo Exited with code: %ERRORLEVEL%
pause
