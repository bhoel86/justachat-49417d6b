@echo off
title Justachat IRC Admin Console v7
cd /d %~dp0
py main.py 2>NUL || python main.py 2>NUL || (
    echo Python not found. Install from python.org (check "Add to PATH").
    pause
)
