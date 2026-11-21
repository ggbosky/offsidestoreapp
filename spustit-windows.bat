@echo off
title Offsidestore Studio
cd /d "%~dp0"

if not exist "package.json" goto :not_extracted

where node >nul 2>nul
if errorlevel 1 goto :no_node

node -e "process.exit(parseInt(process.versions.node) >= 18 ? 0 : 1)"
if errorlevel 1 goto :old_node

if exist ".env" goto :env_ok
copy ".env.example" ".env" >nul
echo Vytvoren soubor .env - klice pro trendy, Shopify a Gemini doplnis pozdeji.
echo Navod: README.md nebo v aplikaci Nastaveni - Propojeni.
echo.
:env_ok

if exist "node_modules\vite" goto :deps_ok
echo Instaluji zavislosti - jen poprve, muze to trvat par minut...
call npm install
if errorlevel 1 goto :install_failed
:deps_ok

echo.
echo Spoustim Offsidestore Studio na http://localhost:5173
echo Toto okno nech otevrene. Ukonceni: Ctrl+C nebo zavrit okno.
echo.
call npm run dev
echo.
echo Aplikace skoncila. Pokud nahore vidis chybu, posli ji.
pause
exit /b 0

:not_extracted
echo CHYBA: Spoustis soubor primo ze ZIPu.
echo Nejdriv ZIP rozbal: pravym tlacitkem na ZIP - Extrahovat vse, a pak spust tento soubor z rozbalene slozky.
pause
exit /b 1

:no_node
echo CHYBA: Chybi Node.js.
echo Stahni verzi LTS z https://nodejs.org, nainstaluj ji, restartuj pocitac a spust tento soubor znovu.
start "" https://nodejs.org
pause
exit /b 1

:old_node
echo CHYBA: Mas starou verzi Node.js. Potrebna je verze 18 nebo novejsi - doporucuji LTS z https://nodejs.org
node -v
start "" https://nodejs.org
pause
exit /b 1

:install_failed
echo.
echo CHYBA: Instalace zavislosti selhala. Zkontroluj pripojeni k internetu a posli text chyby vyse.
pause
exit /b 1
