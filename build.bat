@echo off
rem Packs the plugin into build\heliotrop-<version>.zip (wrapper for build.ps1).
rem Usage: build.bat

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"

if errorlevel 1 (
    echo.
    echo Build FAILED.
)
pause
