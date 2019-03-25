@echo off

SETLOCAL EnableExtensions

:: Get current directory
SET current=%~dp0..\..\..\

:: Does "current" variable have a trailing slash? If so, remove it
IF %current:~-1%==\ SET current=%current:~,-1%
echo 

echo %current%

START /WAIT powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\\package\\windows\\build.ps1" -Loc \""%current%\""