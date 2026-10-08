@echo off
chcp 65001 >nul
title OsintDesk - OSINT Masaustu GUI
cls

echo ========================================================
echo    OsintDesk - OSINT Ag ve Varlik Haritalama (GUI)
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [HATA] Python sisteminizde bulunamadi!
        echo Lutfen https://www.python.org/downloads/ adresinden Python 3 kurun.
        echo Kurulum sirasinda "Add python.exe to PATH" secenegini isaretleyin.
        echo.
        pause
        exit /b 1
    ) else (
        echo Python (py) ile baslatiliyor...
        py main.py
    )
) else (
    echo Python ile baslatiliyor...
    python main.py
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Bir hata olustu.
    pause
)
