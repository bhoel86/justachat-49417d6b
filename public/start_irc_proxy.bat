@echo off
echo Starting IRC Gateway Proxy...
echo.

SET EXE_PATH="C:\Users\dunad\Desktop\kiwiirc-master\webircgateway_windows_amd64.exe"
SET CONFIG_PATH="C:\Users\dunad\Desktop\kiwiirc-master\config.conf"

IF NOT EXIST %EXE_PATH% (
    echo ERROR: webircgateway_windows_amd64.exe not found!
    echo Expected location: %EXE_PATH%
    pause
    exit /b 1
)

IF NOT EXIST %CONFIG_PATH% (
    echo ERROR: config.conf not found!
    echo Expected location: %CONFIG_PATH%
    pause
    exit /b 1
)

echo Starting proxy on 127.0.0.1:6667...
echo Connect mIRC to: 127.0.0.1 port 6667
echo.
%EXE_PATH% -config %CONFIG_PATH%

echo.
echo Proxy has stopped.
pause
