@echo off
chcp 65001 >nul
title Offsidestore Studio
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chybi Node.js. Stahni verzi LTS z https://nodejs.org, nainstaluj a spust znovu.
  start https://nodejs.org
  pause
  exit /b 1
)
if not exist .env (
  copy .env.example .env >nul
  echo Vytvoren soubor .env - dopln do nej klice (navod v README.md nebo v aplikaci: Nastaveni - Propojeni).
)
if not exist node_modules (
  echo Instaluji zavislosti (jen poprve, chvili to trva)...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)
echo Spoustim Offsidestore Studio na http://localhost:5173  (okno nezavirej, ukonceni: Ctrl+C)
call npm run dev
pause
