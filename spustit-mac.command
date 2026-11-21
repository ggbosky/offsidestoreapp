#!/bin/bash
cd "$(dirname "$0")" || exit 1

if [ ! -f package.json ]; then
  echo "CHYBA: Spouštíš soubor přímo ze ZIPu. Nejdřív ZIP rozbal a spusť soubor z rozbalené složky."
  read -n 1 -s -r -p "Stiskni libovolnou klávesu…"; exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "CHYBA: Chybí Node.js. Stáhni verzi LTS z https://nodejs.org, nainstaluj a spusť znovu."
  open https://nodejs.org
  read -n 1 -s -r -p "Stiskni libovolnou klávesu…"; exit 1
fi
if ! node -e "process.exit(parseInt(process.versions.node) >= 18 ? 0 : 1)"; then
  echo "CHYBA: Stará verze Node.js ($(node -v)). Potřebná je 18+ – doporučuji LTS z https://nodejs.org"
  open https://nodejs.org
  read -n 1 -s -r -p "Stiskni libovolnou klávesu…"; exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Vytvořen soubor .env – klíče pro trendy, Shopify a Gemini doplníš později (README.md / Nastavení → Propojení)."
fi
if [ ! -d node_modules/vite ]; then
  echo "Instaluji závislosti – jen poprvé, může to trvat pár minut…"
  if ! npm install; then
    echo "CHYBA: Instalace selhala. Zkontroluj internet a pošli text chyby výše."
    read -n 1 -s -r -p "Stiskni libovolnou klávesu…"; exit 1
  fi
fi
echo ""
echo "Spouštím Offsidestore Studio na http://localhost:5173 (okno nech otevřené, ukončení Ctrl+C)"
npm run dev
