# Offsidestore · Výroba

Lokální desktopová webová aplikace pro řízení výroby ručně pletených hokejových náramků **Offsidestore** („Nos svůj klub. Kdekoliv.“).

- 🔒 Zamykací obrazovka (heslo jako SHA‑256 hash, odemčení jen v paměti → po obnovení/zavření okna znovu zamčeno, automatické zamčení po nečinnosti, Ctrl+L)
- 🏒 **Výrobní fronta** – stavy *Nová → V pletení → Hotovo k odeslání → Odesláno*, automatická cena, filtr a seskupení podle barvy tkaničky
- 🖐️ **Režim u stolu** – fullscreen, obří znaky v pořadí s čísly, barvy tkaničky, poznámka, `Enter` = „Hotovo – další kus“
- 📦 **Sklad** – tkaničky (cm → počet náramků), znaky, koncovky; automatický odpočet při „Hotovo“, vrácení při návratu stavu, červená upozornění pod limitem
- 🧮 **Kalkulačka** – rychlá kalkulace s marží + týmové zakázky (řádek = náramek) s hromadným přidáním do fronty
- 📣 **Sítě** – generátor textů, háčků, nápadů a hashtagů pro IG/Stories/TikTok + náhled vizuálu ke stažení jako PNG
- 💾 Data v `localStorage`, **Export/Import zálohy** jedním klikem (JSON)

## Spuštění na PC

Potřebujete [Node.js 20+](https://nodejs.org) (LTS).

```bash
npm install
npm run dev
```

Otevře se `http://localhost:5173`. **Výchozí heslo: `offside2026`** (změňte ho v Nastavení → Zabezpečení).

Ostatní příkazy:

| Příkaz | Co dělá |
|---|---|
| `npm run build` | produkční sestavení do `dist/` (funguje i z `file://`) |
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

**Tauri** (menší instalátor, vyžaduje Rust): `npm i -D @tauri-apps/cli && npx tauri init` – jako *frontend dist* zadejte `../dist`, *dev URL* `http://localhost:5173`, *before build* `npm run build`.

> Pozn.: Electron/Tauri mají vlastní úložiště – data z prohlížeče se nepřenesou automaticky. Použijte Export zálohy v prohlížeči a Import v aplikaci.

## Architektura

```
src/
  config.ts              ← heslo (hash), logo, akcentové barvy
  types.ts               ← datový model (Order, LaceStock, CharStock, EndcapStock, Club, Settings)
  data/seed.ts           ← výchozí kluby, sklad, ceník + 3 ukázkové objednávky
  lib/
    pricing.ts           ← 290 Kč do 3 znaků + 12 Kč/znak, max 12 (mezery se nepočítají)
    inventory.ts         ← spotřeba materiálu, odpočet/vrácení, limity, poptávka fronty
    quote.ts             ← kalkulace a marže
    backup.ts            ← export/import zálohy s validací
    auth.ts              ← SHA-256 (WebCrypto + JS záloha), ověření hesla
  store/                 ← Zustand: data (persist do localStorage), lock (jen paměť), toasty
  components/            ← Header, Logo, BraceletGraphic (SVG náramek), UI prvky
  features/
    lock/                ← Lock Screen
    production/          ← fronta, formulář, karta objednávky, Režim u stolu
    inventory/ calculator/ social/ settings/
electron/main.cjs        ← Electron obal
```

Stack: **React 18 + TypeScript + Vite + Tailwind CSS + Zustand**, ikony lucide-react, písma Inter + Oswald přibalená lokálně (funguje offline).

## Přizpůsobení

- **Logo:** vložte soubor do `public/brand/` a v `src/config.ts` nastavte `BRAND.logoSrc = 'brand/logo.svg'`. Favicon: `public/brand/favicon.svg`.
- **Akcentová barva:** Nastavení → Vzhled (výchozí ledová modrá `#00B4D8`, předvolba i červená `#E63946`), nebo `DEFAULT_ACCENT` v `src/config.ts`.
- **Heslo:** priorita *Nastavení v aplikaci* → `VITE_APP_PASSWORD_HASH` v `.env` (viz `.env.example`) → `DEFAULT_PASSWORD_HASH` v `src/config.ts`.
- **Barvy klubů** jsou orientační – upravte je ve Skladu (tkaničky) a v Nastavení (kluby).
- **Ceník, náklady na materiál, spotřebu tkaničky a limity** nastavíte v aplikaci.

## Bezpečnost – upřímně

Zámek chrání před náhodným pohledem „přes rameno“ u stolu. Nejde o šifrování: data v `localStorage` si technicky zdatný člověk s přístupem k počítači přečte. Pro citlivá data (adresy zákazníků) používejte zamčený uživatelský účet OS / šifrovaný disk a zálohy ukládejte na bezpečné místo.
