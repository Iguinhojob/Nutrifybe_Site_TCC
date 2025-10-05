@echo off
echo Iniciando Nutrifybe...
echo.
echo 1. Instalando dependencias...
call npm install --silent
echo.
echo 2. Iniciando servidor JSON...
start "JSON Server" cmd /k "npm run server"
timeout /t 3 /nobreak >nul
echo.
echo 3. Iniciando aplicacao React...
start "React App" cmd /k "npm start"
echo.
echo Nutrifybe iniciado com sucesso!
echo JSON Server: http://localhost:3001
echo React App: http://localhost:3000
pause