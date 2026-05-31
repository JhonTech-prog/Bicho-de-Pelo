$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Instalando dependencias se necessario..."
npm install

Write-Host "Gerando build do frontend..."
npm run build

Write-Host "Iniciando Bicho de Pelo em http://localhost:3333"
npm run start
