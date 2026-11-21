# Offsidestore Studio

Lokální aplikace pro značku **Offsidestore** („Nos svůj klub. Kdekoliv.“) – **obsah na sítě a CRM vztahů**, v barvách webu offsidestore.cz.
Ze Shopify si bere jen to, co pomáhá obsahu a vztahům (co se prodává, co roste, kdo kupuje opakovaně) – tržby a účetnictví zůstávají v Shopify.

- 🔒 **Zamykací obrazovka** – heslo jako SHA‑256 hash, odemčení jen v paměti (po obnovení/zavření okna znovu zamčeno), automatické zamčení po nečinnosti, Ctrl+L
- 🔥 **Radar trendů** – Claude prohledá web (CZ/SK, svět, hokej, popkultura, meme formáty) + živé Google Trends Česko a vymyslí trendjackingové příspěvky v duchu Jablkoňovny: koncept, háček, popisek, hashtagy, prompt pro úpravu fotky, trvanlivost trendu a riziko pro značku. Jedním klikem do plánu; volitelně hlídání 1× denně.
- 🖼️ **Úprava fotek přes Gemini (Nano Banana)** – vlastní fotka náramku + prompt z nápadu → upravený vizuál ke stažení
- 🛍️ **Shopify** – objednávky za 30 dní (kusy podle klubů, které kluby rostou, nejčastější vlastní nápisy, nejsilnější den, milníky) → nápady na obsah z dat; fotky produktů do knihovny náramků; stálí zákazníci do CRM jako ambasadoři
- 🏁 **Přehled** – co dnes publikovat, co je po termínu, komu se ozvat, blížící se příležitosti (Black Friday, Vánoce, derby…), týdenní kalendář, mix obsahu podle pilířů
- 🗓️ **Obsah** – plán příspěvků pro IG (příspěvek, Reels, Story) a TikTok: tabule *Nápad → Natočit → Střih a text → Naplánováno → Publikováno* (přetahování), měsíční kalendář, editor s háčkem, popiskem, hashtagy, seznamem záběrů, propojením na náramky a spolupráce, „Navrhnout text“
- 🤝 **Kontakty (CRM)** – tvůrci, fankluby, hráči, fanshopy, média; fáze spolupráce (Tip → Osloveno → … → Spolupráce běží), další krok s připomínkou, historie komunikace (DM, e‑mail, poslaný náramek…)
- 💎 **Náramky** – knihovna designů a nápadů (klub, zkratka, barva tkaničky z konfigurátoru webu, fotka, stav: v nabídce / nápad / limitka)
- ✨ **Generátor** – texty v hlasu značky, háčky, nápady na natáčení, hashtagy + vizuál 4:5 / 9:16 ke stažení jako PNG; vše jde jedním klikem uložit do plánu
- 💾 Data v `localStorage`, **záloha a obnova** jedním klikem (JSON)

## Spuštění na PC

Potřebujete [Node.js 20+](https://nodejs.org) (LTS).

**Nejjednodušší:** dvojklik na `spustit-windows.bat` (Windows) nebo `spustit-mac.command` (Mac). Poprvé nainstaluje závislosti, vytvoří `.env` a otevře aplikaci v prohlížeči. Okno s příkazovou řádkou nechte otevřené, dokud aplikaci používáte.

Ručně:

```bash
npm install
npm run dev
```

Otevře se `http://localhost:5173`. **Výchozí heslo: `offside2026`** (změňte ho v Nastavení → Zabezpečení).

### Propojení se Shopify, Claude a Gemini

Zkopírujte `.env.example` jako `.env` a doplňte klíče (podrobný návod je i v aplikaci: Nastavení → Propojení):

| Proměnná | Kde ji vzít | K čemu |
|---|---|---|
| `ANTHROPIC_API_KEY` | platform.claude.com → API Keys | Radar trendů (vyhledávání na webu + nápady) |
| `SHOPIFY_STORE` | část adresy adminu před `.myshopify.com` | Shopify |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` | Shopify admin → Nastavení → Aplikace → Vývoj aplikací → aplikace v Dev Dashboardu (oprávnění `read_orders`, `read_products`, volitelně `read_customers`), vydat verzi a nainstalovat do obchodu | token se získává automaticky a obnovuje se každých 24 h |
| `SHOPIFY_ADMIN_TOKEN` | jen u starší vlastní aplikace s tokenem `shpat_…` (místo client ID/secret) | Shopify |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key | úprava fotek |

Klíče čte jen lokální server (součást `npm run dev` / `npm start`), do prohlížeče se nedostanou. API přijímá požadavky jen z tohoto počítače a jen z vlastní stránky aplikace.

**Náklady:** jedno hledání trendů = 2 volání Claude (průzkum s webovým vyhledáváním + návrh nápadů), řádově jednotky až nízké desítky Kč. Automatické hledání (1× denně) je ve výchozím stavu vypnuté. Na odmítnutí požadavku má API zapnutý automatický záložní model (`fallbacks: "default"`).

Ostatní příkazy:

| Příkaz | Co dělá |
|---|---|
| `npm start` | sestaví aplikaci a spustí ji i s lokálním serverem (trendy, Shopify, Gemini) |
| `npm run build` | produkční sestavení do `dist/` (bez serveru funguje jen offline část) |
| `npm run preview` | spustí sestavenou verzi |
| `npm test` | testy logiky (ceník, sklad, zálohy, heslo) |
| `npm run hash-password -- "NoveHeslo"` | vygeneruje hash pro `.env` |

### Jako desktopová aplikace

**Electron** (připravený soubor `electron/main.cjs`):

```bash
npm i -D electron
npm run electron
```

Instalátor (.exe/.dmg) pak vyrobíte např. přes `electron-builder` (`npx electron-builder --win`).

> Electron/Tauri obal zatím spouští jen offline část. Pro trendy, Shopify a Gemini používejte `npm run dev` nebo `npm start` (server běží uvnitř Vite).

**Tauri** (menší instalátor, vyžaduje Rust): `npm i -D @tauri-apps/cli && npx tauri init` – jako *frontend dist* zadejte `../dist`, *dev URL* `http://localhost:5173`, *before build* `npm run build`.

> Pozn.: Electron/Tauri mají vlastní úložiště – data z prohlížeče se nepřenesou automaticky. Použijte Export zálohy v prohlížeči a Import v aplikaci.

## Architektura

```
src/
  config.ts              ← heslo (hash), logo, akcentové barvy
  types.ts               ← datový model (Order, LaceStock, CharStock, EndcapStock, Club, Settings)
  data/seed.ts           ← 12 klubů z webu (zkratky, barvy tkaniček) + ukázkový obsah a kontakty
  lib/
    selectors.ts         ← co je po termínu, co je na řadě, komu se ozvat
    dates.ts meta.ts     ← data, popisky fází, pilířů a typů kontaktů
    backup.ts auth.ts    ← záloha/obnova, SHA-256 heslo
  store/                 ← Zustand: data (persist), ui (otevřené editory), lock (jen paměť), toasty, potvrzení
  components/            ← Header, Logo (znak z webu), BraceletGraphic (plochá tkanička + stříbrná písmena)
  features/
    lock/ dashboard/ content/ crm/ bracelets/ generator/ settings/
    trends/              ← Radar trendů, karty nápadů, Gemini studio
    shopify/             ← panel s daty a nápady z prodejů
server/                  ← lokální API (Vite plugin): Shopify GraphQL, Google Trends RSS, Claude (web search + structured outputs), Gemini
electron/main.cjs        ← Electron obal
```

Stack: **React 18 + TypeScript + Vite + Tailwind CSS + Zustand**, ikony lucide-react, písmo Assistant (jako na webu) přibalené lokálně – funguje offline.

## Přizpůsobení

- **Logo:** vložte soubor do `public/brand/` a v `src/config.ts` nastavte `BRAND.logoSrc = 'brand/logo.svg'`. Favicon: `public/brand/favicon.svg`.
- **Barvy:** převzaté z offsidestore.cz (`tailwind.config.js` – černá `#050505`, červená `#EC0016`, přechod `#B01E28 → #340A0E`).
- **Heslo:** priorita *Nastavení v aplikaci* → `VITE_APP_PASSWORD_HASH` v `.env` (viz `.env.example`) → `DEFAULT_PASSWORD_HASH` v `src/config.ts`.
- **Kluby a barvy tkaniček** odpovídají fotkám produktů na webu; upravíte je v Nastavení → Kluby.
- **Příležitosti** (derby, play-off, svátky) přidáte v Nastavení.

## Bezpečnost – upřímně

Zámek chrání před náhodným pohledem „přes rameno“ u stolu. Nejde o šifrování: data v `localStorage` (kontakty!) si technicky zdatný člověk s přístupem k počítači přečte. Importovaní stálí zákazníci ze Shopify (jména, e‑maily) se ukládají také jen lokálně a jsou i v záloze. Do Claude se posílají jen souhrnná čísla (kusy podle klubů, opakované nápisy), nikdy jména ani e‑maily. Pro citlivá data (e‑maily a telefony kontaktů) používejte zamčený uživatelský účet OS / šifrovaný disk a zálohy ukládejte na bezpečné místo.
