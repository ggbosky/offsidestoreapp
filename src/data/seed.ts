import type { AppData, Bracelet, Club, Contact, ContentItem, KeyDate, Settings } from '../types';
import { addDays, today } from '../lib/dates';

/** Kluby a barvy tkaniček podle offsidestore.cz (fotky produktů). */
export const DEFAULT_CLUBS: Club[] = [
  { id: 'lit', name: 'HC VERVA LITVÍNOV', short: 'Litvínov', abbr: 'LIT', laceColor: '#F2C300', hashtag: '#hcverva' },
  { id: 'spa', name: 'HC SPARTA PRAHA', short: 'Sparta', abbr: 'SPA', laceColor: '#B01E28', hashtag: '#hcsparta' },
  { id: 'pce', name: 'HC DYNAMO PARDUBICE', short: 'Pardubice', abbr: 'PCE', laceColor: '#B01E28', hashtag: '#hcdynamo' },
  { id: 'jih', name: 'DUKLA JIHLAVA', short: 'Jihlava', abbr: 'JIH', laceColor: '#B01E28', hashtag: '#duklajihlava' },
  { id: 'vse', name: 'VHK ROBE VSETÍN', short: 'Vsetín', abbr: 'VSE', laceColor: '#0F9D4F', hashtag: '#vhkvsetin' },
  { id: 'zln', name: 'RI OKNA BERANI ZLÍN', short: 'Zlín', abbr: 'ZLN', laceColor: '#F2C300', hashtag: '#beranizlin' },
  { id: 'kom', name: 'HC KOMETA BRNO', short: 'Kometa', abbr: 'KOM', laceColor: '#0B4EA2', hashtag: '#kometabrno' },
  { id: 'tre', name: 'HK DUKLA TRENČÍN', short: 'Trenčín', abbr: 'TRE', laceColor: '#B01E28', hashtag: '#duklatrencin' },
  { id: 'slb', name: 'HC SLOVAN BRATISLAVA', short: 'Slovan', abbr: 'SLB', laceColor: '#3FA9E0', hashtag: '#hcslovan' },
  { id: 'sla', name: 'HC SLAVIA PRAHA', short: 'Slavia', abbr: 'SLA', laceColor: '#B01E28', hashtag: '#hcslavia' },
  { id: 'kla', name: 'HC RYTÍŘI KLADNO', short: 'Kladno', abbr: 'KLA', laceColor: '#0B4EA2', hashtag: '#rytirikladno' },
  { id: 'tri', name: 'HC OCELÁŘI TŘINEC', short: 'Třinec', abbr: 'TRI', laceColor: '#B01E28', hashtag: '#hcocelari' },
];

export const SLOVAK_CLUBS = new Set(['tre', 'slb']);

export const DEFAULT_SETTINGS: Settings = {
  passwordHash: null,
  autoLockMinutes: 15,
  lastBackupAt: null,
  basePrice: 290,
  includedChars: 3,
  extraCharPrice: 12,
  maxChars: 12,
};

const now = () => new Date().toISOString();

function seedBracelets(): Bracelet[] {
  const fromClubs = DEFAULT_CLUBS.map<Bracelet>((c) => ({
    id: `b-${c.id}`,
    name: `${c.short} – ${c.abbr}`,
    clubId: c.id,
    letters: c.abbr,
    laceColor: c.laceColor,
    status: 'nabidka',
    notes: '',
    createdAt: now(),
  }));
  return [
    ...fromClubs,
    { id: 'b-idea-derby', name: 'Derby edice (ukázka nápadu)', clubId: null, letters: 'DERBY', laceColor: '#111111', status: 'napad', notes: 'Černá tkanička, limitka k derby zápasům. Ověřit zájem anketou ve Stories.', createdAt: now() },
    { id: 'b-idea-xmas', name: 'Vánoční dárek (ukázka nápadu)', clubId: null, letters: '♥ HOKEJ', laceColor: '#FFFFFF', status: 'limitka', notes: 'Bílá tkanička + kartička „Pod stromeček“.', createdAt: now() },
  ];
}

function seedContent(): ContentItem[] {
  const t = today();
  const base = {
    contactIds: [] as string[],
    hashtags: '',
    notes: '',
    link: '',
    result: '',
    time: '18:00',
    createdAt: now(),
    updatedAt: now(),
  };
  return [
    {
      ...base,
      id: 'c-1',
      title: 'Timelapse: pletení LIT od tkaničky po koncovku',
      stage: 'prep',
      pillar: 'vyroba',
      platforms: ['tiktok', 'ig-reel'],
      date: addDays(t, 2),
      braceletIds: ['b-lit'],
      hook: 'Tohle bylo včera ještě v brusli…',
      caption: 'Z brusle na zápěstí. Jeden náramek, jedna tkanička, tři písmena. 🏒',
      shots: [
        { id: 's1', text: 'Detail tkaničky v brusli (5 s)', done: true },
        { id: 's2', text: 'Navlékání písmen L-I-T', done: false },
        { id: 's3', text: 'Hotový náramek na ruce na zimáku', done: false },
      ],
    },
    {
      ...base,
      id: 'c-2',
      title: 'Black Friday – „Nos svůj klub“ carousel 12 klubů',
      stage: 'edit',
      pillar: 'produkt',
      platforms: ['ig-post'],
      date: addDays(t, 7),
      braceletIds: ['b-spa', 'b-kom', 'b-pce'],
      hook: 'Swipe a najdi svůj klub →',
      caption: '12 klubů. Jedna tkanička z brusle. Který je tvůj? 👇',
      shots: [{ id: 's1', text: 'Fotka všech 12 náramků vedle sebe na ledě', done: true }],
    },
    {
      ...base,
      id: 'c-3',
      title: 'Story anketa: Jakou limitku chcete na derby?',
      stage: 'scheduled',
      pillar: 'fanousci',
      platforms: ['ig-story'],
      date: t,
      time: '20:00',
      braceletIds: ['b-idea-derby'],
      hook: 'Rozhodni ty 🗳️',
      caption: 'Černá DERBY, nebo klubová barva?',
      shots: [],
    },
    {
      ...base,
      id: 'c-4',
      title: 'Spolupráce: unboxing u tvůrce (ukázka)',
      stage: 'idea',
      pillar: 'spoluprace',
      platforms: ['tiktok'],
      date: null,
      braceletIds: ['b-kom'],
      contactIds: ['k-1'],
      hook: '',
      caption: '',
      shots: [],
    },
    {
      ...base,
      id: 'c-5',
      title: 'Zápasový den: SPA na tribuně',
      stage: 'published',
      pillar: 'zapas',
      platforms: ['ig-story', 'ig-post'],
      date: addDays(t, -3),
      braceletIds: ['b-spa'],
      hook: 'Zápasový den = SPA na ruce',
      caption: 'Tribuna, šála, náramek. 🔥',
      shots: [],
      result: 'Story: hodně odpovědí na anketu. Příště přidat odkaz na konfigurátor.',
    },
  ];
}

function seedContacts(): Contact[] {
  const t = today();
  const base = { email: '', phone: '', tiktok: '', tags: [] as string[], createdAt: now(), updatedAt: now() };
  return [
    {
      ...base,
      id: 'k-1',
      name: 'Hokejový vlogger (ukázka)',
      kind: 'tvurce',
      instagram: '@ukazka_hokejvlog',
      tiktok: '@ukazka_hokejvlog',
      followers: 18500,
      clubIds: ['kom'],
      stage: 'jednani',
      nextAction: 'Poslat náramek KOM + domluvit termín videa',
      nextDate: addDays(t, 1),
      tags: ['unboxing', 'tiktok'],
      notes: 'Fandí Kometě, točí vlogy ze zápasů. Chce náramek pro sebe i pro soutěž.',
      interactions: [
        { id: 'i1', date: addDays(t, -6), type: 'dm', text: 'Napsal jsem na IG, poslal odkaz na konfigurátor.' },
        { id: 'i2', date: addDays(t, -4), type: 'dm', text: 'Odpověděl – má zájem, chce 2 kusy na giveaway.' },
      ],
    },
    {
      ...base,
      id: 'k-2',
      name: 'Fanklub – kotel (ukázka)',
      kind: 'fanklub',
      instagram: '@ukazka_fanklub',
      followers: 3200,
      clubIds: ['lit'],
      stage: 'osloveno',
      nextAction: 'Připomenout se – nabídka týmové edice pro členy',
      nextDate: addDays(t, -1),
      notes: 'Mají cca 150 členů. Možnost společné objednávky na výjezd.',
      interactions: [{ id: 'i1', date: addDays(t, -8), type: 'email', text: 'Poslal jsem nabídku a fotky LIT.' }],
    },
    {
      ...base,
      id: 'k-3',
      name: 'Fanshop u stadionu (ukázka)',
      kind: 'obchod',
      instagram: '',
      email: 'info@example.cz',
      followers: null,
      clubIds: ['spa'],
      stage: 'tip',
      nextAction: 'Zajít osobně s ukázkovou sadou',
      nextDate: addDays(t, 5),
      notes: 'Komisní prodej? Zjistit podmínky.',
      interactions: [],
    },
    {
      ...base,
      id: 'k-4',
      name: 'Juniorka – hráč U20 (ukázka)',
      kind: 'hrac',
      instagram: '@ukazka_hrac',
      followers: 2400,
      clubIds: ['pce'],
      stage: 'spoluprace',
      nextAction: 'Repost jeho fotky s náramkem',
      nextDate: addDays(t, 3),
      tags: ['ambasador'],
      notes: 'Nosí PCE na trénincích, svolil s fotkami.',
      interactions: [{ id: 'i1', date: addDays(t, -14), type: 'naramek', text: 'Předán náramek PCE + 2 pro spoluhráče.' }],
    },
  ];
}

/** Příležitosti – data se počítají pro aktuální sezónu, upravte podle sebe. */
function seedKeyDates(): KeyDate[] {
  const y = new Date().getFullYear();
  const fridayAfterThanksgiving = (() => {
    const d = new Date(y, 10, 1);
    const firstThu = ((4 - d.getDay() + 7) % 7) + 1;
    return `${y}-11-${String(firstThu + 21 + 1).padStart(2, '0')}`;
  })();
  return [
    { id: 'kd-bf', date: fridayAfterThanksgiving, title: 'Black Friday', note: 'Dárková kampaň, carousel všech klubů.' },
    { id: 'kd-mik', date: `${y}-12-06`, title: 'Mikuláš', note: '' },
    { id: 'kd-xmas', date: `${y}-12-15`, title: 'Poslední objednávky pod stromeček', note: 'Ověřit termíny dopravy.' },
    { id: 'kd-val', date: `${y + 1}-02-14`, title: 'Valentýn', note: 'Párové náramky – dvě barvy, dvě jména.' },
    { id: 'kd-po', date: `${y + 1}-03-10`, title: 'Start play-off (orientačně)', note: 'Upravte podle rozpisu soutěže.' },
  ];
}

export function createSeedData(opts: { empty?: boolean } = {}): AppData {
  return {
    schemaVersion: 2,
    clubs: DEFAULT_CLUBS.map((c) => ({ ...c })),
    bracelets: seedBracelets(),
    content: opts.empty ? [] : seedContent(),
    keyDates: seedKeyDates(),
    contacts: opts.empty ? [] : seedContacts(),
    settings: { ...DEFAULT_SETTINGS },
  };
}
