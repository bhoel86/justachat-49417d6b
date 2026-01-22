@echo off
echo ========================================
echo Downloading IRC Gateway for Windows
echo ========================================
echo.

cd /d "C:\Users\dunad\Desktop\kiwiirc-master"

echo Downloading webircgateway...
echo.

curl -L -o webircgateway_windows_amd64.exe "https://github.com/kiwiirc/webircgateway/releases/download/v1.7.2/webircgateway_windows_amd64.exe"

if exist "webircgateway_windows_amd64.exe" (
    echo.
    echo [SUCCESS] Downloaded webircgateway_windows_amd64.exe
    echo.
    echo Now starting the proxy...
    echo Connect mIRC to 127.0.0.1:6667
    echo.
    webircgateway_windows_amd64.exe -config config.conf
) else (
    echo.
    echo [ERROR] Download failed. 
    echo.
    echo Please download manually from:
    echo https://github.com/kiwiirc/webircgateway/releases
    echo.
    echo Get: webircgateway_windows_amd64.exe
    echo Save it to: C:\Users\dunad\Desktop\kiwiirc-master\
)

echo.
pause
