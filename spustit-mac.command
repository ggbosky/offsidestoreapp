#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Chybí Node.js. Stáhni verzi LTS z https://nodejs.org, nainstaluj a spusť znovu."
  open https://nodejs.org
  read -n 1 -s -r -p "Stiskni libovolnou klávesu…"
  exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Vytvořen soubor .env – doplň do něj klíče (návod v README.md nebo v aplikaci: Nastavení → Propojení)."
fi
if [ ! -d node_modules ]; then
  echo "Instaluji závislosti (jen poprvé, chvíli to trvá)…"
  npm install || exit 1
fi
echo "Spouštím Offsidestore Studio na http://localhost:5173 (ukončení: Ctrl+C)"
npm run dev
