# Offsidestore Studio

Lokální aplikace pro značku **Offsidestore** („Nos svůj klub. Kdekoliv.“) – **obsah na sítě a CRM vztahů**, v barvách webu offsidestore.cz.
Objednávky, tržby a zákazníky z e-shopu záměrně neřeší – to dělá Shopify.

- 🔒 **Zamykací obrazovka** – heslo jako SHA‑256 hash, odemčení jen v paměti (po obnovení/zavření okna znovu zamčeno), automatické zamčení po nečinnosti, Ctrl+L
- 🏁 **Přehled** – co dnes publikovat, co je po termínu, komu se ozvat, blížící se příležitosti (Black Friday, Vánoce, derby…), týdenní kalendář, mix obsahu podle pilířů
- 🗓️ **Obsah** – plán příspěvků pro IG (příspěvek, Reels, Story) a TikTok: tabule *Nápad → Natočit → Střih a text → Naplánováno → Publikováno* (přetahování), měsíční kalendář, editor s háčkem, popiskem, hashtagy, seznamem záběrů, propojením na náramky a spolupráce, „Navrhnout text“
- 🤝 **Kontakty (CRM)** – tvůrci, fankluby, hráči, fanshopy, média; fáze spolupráce (Tip → Osloveno → … → Spolupráce běží), další krok s připomínkou, historie komunikace (DM, e‑mail, poslaný náramek…)
- 💎 **Náramky** – knihovna designů a nápadů (klub, zkratka, barva tkaničky z konfigurátoru webu, fotka, stav: v nabídce / nápad / limitka)
- ✨ **Generátor** – texty v hlasu značky, háčky, nápady na natáčení, hashtagy + vizuál 4:5 / 9:16 ke stažení jako PNG; vše jde jedním klikem uložit do plánu
- 💾 Data v `localStorage`, **záloha a obnova** jedním klikem (JSON)

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
  data/seed.ts           ← 12 klubů z webu (zkratky, barvy tkaniček) + ukázkový obsah a kontakty
  lib/
    selectors.ts         ← co je po termínu, co je na řadě, komu se ozvat
    dates.ts meta.ts     ← data, popisky fází, pilířů a typů kontaktů
    backup.ts auth.ts    ← záloha/obnova, SHA-256 heslo
  store/                 ← Zustand: data (persist), ui (otevřené editory), lock (jen paměť), toasty, potvrzení
  components/            ← Header, Logo (znak z webu), BraceletGraphic (plochá tkanička + stříbrná písmena)
  features/
    lock/ dashboard/ content/ crm/ bracelets/ generator/ settings/
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

Zámek chrání před náhodným pohledem „přes rameno“ u stolu. Nejde o šifrování: data v `localStorage` (kontakty!) si technicky zdatný člověk s přístupem k počítači přečte. Pro citlivá data (e‑maily a telefony kontaktů) používejte zamčený uživatelský účet OS / šifrovaný disk a zálohy ukládejte na bezpečné místo.
