@echo off
set "NODE_PATH=C:\tools\nodejs\node-v20.18.0-win-x64"
set "PATH=%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin;%PATH%"
echo Starting Roblox Bot...
cd /d "%~dp0"
start "" "%NODE_PATH%\node.exe" server.js
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
echo Servidor rodando em http://localhost:3000
pause
