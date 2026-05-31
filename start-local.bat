@echo off
setlocal
cd /d "%~dp0"
echo Instalando dependencias se necessario...
call npm install
if errorlevel 1 exit /b %errorlevel%
echo Gerando build do frontend...
call npm run build
if errorlevel 1 exit /b %errorlevel%
echo Iniciando Bicho de Pelo em http://localhost:3333
call npm run start
