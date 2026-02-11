@echo off
title Justachat IRC Admin Console v7
cd /d %~dp0
echo Starting Justachat IRC Admin Console...
echo.
py main.py 2>NUL && goto :end
python main.py 2>NUL && goto :end
python3 main.py 2>NUL && goto :end
echo.
echo ============================================
echo  ERROR: Python not found or crashed.
echo  Install Python from https://python.org
echo  Make sure "Add to PATH" is checked.
echo  Also ensure tkinter is included (default).
echo ============================================
echo.
:end
pause
