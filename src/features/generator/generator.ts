import type { Platform } from '../../types';

export type SocialTone = 'meme' | 'hype' | 'fan' | 'product' | 'behind';
export const TONE_LABEL: Record<SocialTone, string> = {
  meme: 'Meme (styl Jablkoňovny)',
  hype: 'Zápasový / hype',
  fan: 'Fanouškovský',
  product: 'Produktový',
  behind: 'Zákulisí výroby',
};

export interface SocialInput {
  club: string | null;
  clubHashtag?: string;
  slovak?: boolean;
  text: string;
  laceName: string;
  platform: Platform;
  tone: SocialTone;
  price: number;
  web: string;
  claim: string;
  seed: number;
}

/** Meme: velký text na obrázku (nahoře / dole) + krátký popisek. */
export interface MemeIdea {
  top: string;
  bottom: string;
  caption: string;
}

export interface SocialIdeas {
  memes: MemeIdea[];
  captions: string[];
  hooks: string[];
  visual: string[];
  hashtags: string;
}

/**
 * Meme šablony ve stylu Jablkoňovny: situace, ve které se fanoušek pozná, velký text na fotce
 * a jedna krátká věta s emoji v popisku. {club} = krátký název klubu, {text} = zkratka.
 */
const MEMES: MemeIdea[] = [
  { top: 'Babička: Zase utrácíš za ten hokej?', bottom: 'Já: Je to tkanička z brusle, babi. Za 290.', caption: 'Babička to pochopila. Asi. 😅' },
  { top: '2013: šála po dědovi', bottom: '2026: tkanička z brusle na ruce', caption: 'Ten čas tak letí 🥲' },
  { top: 'Když ti v práci zakážou dres', bottom: '{text} pod rukávem', caption: 'Nos svůj klub. Kdekoliv. 🤫' },
  { top: 'Permanentka 6 000 Kč · pivo 70 Kč · náramek 290 Kč', bottom: 'Fandit {club}: k nezaplacení', caption: 'Účetní to nechápe. My jo. 🏒' },
  { top: 'Tým prohraje 0:5', bottom: 'Náramek {text}: pořád na ruce', caption: 'Věrnost se nesundává. 💪' },
  { top: 'POV: přítelkyně fandí jinému klubu', bottom: 'Kupuješ jí náramek. Svůj.', caption: 'Láska má hranice. A barvy. ❤️🖤' },
  { top: 'Já po třetí třetině', bottom: 'Můj náramek po třetí třetině', caption: 'Pot, mráz, pivo. Vydrží všechno. 💧' },
  { top: 'Táta: Za nás se fandilo jinak', bottom: 'Taky táta: „Objednáš mi taky {text}?“', caption: 'Táta je v tom s námi. 😂' },
  { top: 'Když máš jméno na 13 písmen', bottom: 'a maximum je 12', caption: 'Promiň, Maxmiliánku. 🥲' },
  { top: 'Mise: dostat náramek přes hlídku u vstupu', bottom: 'Splněno ✅', caption: 'Mise splněna! 🫡' },
  { top: 'Těšíš se na Vánoce?', bottom: 'Ježíšek letos fandí {club}', caption: 'Těšíš se na Vánoce? 🎄' },
  { top: 'Rozhodčí: nevidím faul', bottom: 'Taky rozhodčí: nevidí ani tenhle náramek', caption: 'Brýle nepomůžou. 👀' },
  { top: 'Kamarád: Zase nový náramek?', bottom: 'Já: To je {text}. To se počítá jako dres.', caption: 'Nepočítá. Ale zní to dobře. 😎' },
  { top: 'Derby za týden', bottom: 'Já už v plné výbavě', caption: 'Kdo je taky připravený? 🔥' },
];

// Hlas značky podle offsidestore.cz: krátké věty, „tkanička z brusle“, „barva podle dresu“, „splétáno rukou“.
const CAPTIONS: Record<SocialTone, string[]> = {
  meme: MEMES.map((m) => m.caption),
  hype: [
    'Zápasový den. {text} na zápěstí. 🏒🔥\n{clubLine}Tkanička z brusle, zkratka v pletení.\n👉 {web}',
    'Kdo jde dneska na zimák? 🙋 {text} je připravený na buly.\n{clubLine}Splétáno rukou, kus po kuse.\n🔗 {web}',
    'Třetí třetina, vyrovnaný stav a na ruce {text}. Tohle se nesundává. 💥\n{clubLine}{claim}\n➡️ {web}',
    'Tribuna křičí, ruka nosí {text}. 🔴\n{clubLine}Barva podle dresu, ne podle nejbližšího šuplíku.\n{web}',
  ],
  fan: [
    'Fanoušek se pozná podle detailů. 😉 {text}\n{clubLine}{claim}\n📦 {web}',
    'Na zimáku, v práci, ve škole. Nos svůj klub. Kdekoliv. {text}\n{clubLine}👉 {web}',
    'Dárek pro tátu, bráchu, holku nebo sebe? {text} sedí každému, kdo žije hokejem. 🎁\n{clubLine}Od {price} Kč · {web}',
    'Ukaž, komu fandíš. 💪 {text}\nNapiš do komentu svůj klub – další fotku uděláme s tvojí zkratkou.\n{web}',
  ],
  product: [
    '{text} 🏒\n• tkanička z brusle – snese pot, mráz i vodu\n• barva: {lace}\n• zkratka zapletená, ne nalepená\n• 3 znaky v ceně {price} Kč, další +12 Kč\n🛒 {web}',
    'Znaky nejsou nalepené ani potištěné. Jsou navlečené a zapletené do tkaničky. {text} ✔️\n{clubLine}Vlastní nápis až 12 znaků → {web}',
    'Univerzální velikost s posuvným uzlem, sedne na 16–21 cm. {text} – stačí si vybrat klub.\n{clubLine}{web}',
  ],
  behind: [
    'Jak vzniká {text}? Tkanička, písmena, trpělivost a hokej v pozadí. 🎧🏒\n{clubLine}👉 {web}',
    'Drobné odchylky v napětí splétání nejsou vada. Jsou důkaz, že to nedělal stroj. ✋ {text}\n{web}',
    'Žádná fabrika. Jen stůl, metry hokejových tkaniček a {count} písmena. {text} právě odchází z dílny. 📦\n{claim}\n{web}',
  ],
};

const HOOKS: Record<Platform, string[]> = {
  'ig-post': ['Swipe → detail písmen a tkaničky', 'Uhádneš klub jen podle barvy? 👀', 'Napiš do komentu, jakou zkratku bys chtěl/a', 'Označ kámoše, který tohle potřebuje'],
  'ig-reel': ['Tohle bylo včera ještě v brusli…', 'Z brusle na zápěstí za 30 sekund', 'POV: pleteš náramek pro fanouška {club}', '3 věci, které nevíš o hokejových tkaničkách'],
  'ig-story': ['Anketa: {club} vyhraje dnes o kolik? 🗳️', 'Otázka: „Jakou zkratku bys chtěl/a na náramek?“', 'Odpočet do zápasu + odkaz na konfigurátor', 'Kvíz: kolik písmen je v ceně? (3!)'],
  tiktok: ['POV: pleteš náramek pro fanouška {club} 🏒', 'Tohle bylo kdysi v hokejové brusli…', 'Plete se {text} – vydržíš až do konce?', 'Satisfying: celé pletení za 15 sekund ⏩'],
};

const VISUAL: Record<Platform, string[]> = {
  'ig-post': [
    'Náramek {text} na červeném zábradlí stadionu (styl fotek z e-shopu), ostrá písmena.',
    'Flatlay na černém pozadí: tkanička, stříbrná písmena, hotový náramek.',
    'Náramek na ruce držící lístek / permanentku na zápas {club}.',
  ],
  'ig-reel': ['Timelapse pletení od tkaničky po koncovku, závěr na ruce s {text}.', 'Transition: brusle → vytažení tkaničky → střih → hotový náramek.'],
  'ig-story': ['Vertikální video 5 s z tribuny s náramkem {text} + anketa.', 'Foto z dílny, rozpracovaný kus, sticker s odkazem.'],
  tiktok: ['Timelapse + trend zvuk, poslední záběr: {text} na ruce na zimáku.', 'Rozbalení objednávky: obálka, náramek {text}, reakce.'],
};

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

function pick<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function generateIdeas(i: SocialInput): SocialIdeas {
  const rand = rng(i.seed);
  const text = i.text.trim() || 'OFFSIDE';
  const count = Array.from(text.replace(/\s/g, '')).length;
  const fill = (t: string) =>
    t
      .replaceAll('{text}', text)
      .replaceAll('{club}', i.club ?? 'tvého klubu')
      .replaceAll('{clubLine}', i.club ? `Pro fanoušky: ${i.club}.\n` : '')
      .replaceAll('{lace}', i.laceName.toLowerCase())
      .replaceAll('{web}', i.web)
      .replaceAll('{claim}', i.claim)
      .replaceAll('{price}', String(i.price))
      .replaceAll('{count}', String(count));

  const tags = new Set<string>(['#offsidestore', '#hokej', '#nossvujklub', '#hokejovynaramek', '#handmade']);
  if (i.slovak) ['#slovenskyhokej', '#hokejslovensko'].forEach((t) => tags.add(t));
  else ['#ceskyhokej', '#extraliga'].forEach((t) => tags.add(t));
  if (i.clubHashtag) tags.add(i.clubHashtag);
  const tt = slug(text);
  if (tt.length >= 3) tags.add(`#${tt}`);
  if (i.platform === 'tiktok' || i.platform === 'ig-reel') ['#hockeytok', '#satisfying'].forEach((t) => tags.add(t));
  if (i.tone === 'meme') {
    // memy: málo hashtagů, ať nevypadají jako reklama
    tags.clear();
    tags.add('#offsidestore');
    if (i.clubHashtag) tags.add(i.clubHashtag);
    tags.add('#hokej');
  } else if (i.platform === 'ig-story') {
    tags.clear();
    tags.add('#offsidestore');
    tags.add(i.clubHashtag ?? '#hokej');
  }

  const memes = i.tone === 'meme' ? pick(MEMES, 4, rand).map((m) => ({ top: fill(m.top), bottom: fill(m.bottom), caption: fill(m.caption) })) : [];
  return {
    memes,
    captions: i.tone === 'meme' ? memes.map((m) => m.caption) : pick(CAPTIONS[i.tone], 3, rand).map(fill),
    hooks: pick(HOOKS[i.platform], 3, rand).map(fill),
    visual: pick(VISUAL[i.platform], 2, rand).map(fill),
    hashtags: [...tags].join(' '),
  };
}
