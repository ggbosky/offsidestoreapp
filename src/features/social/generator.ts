export type SocialFormat = 'post' | 'story' | 'tiktok';
export type SocialTone = 'hype' | 'fan' | 'product' | 'behind';

export const FORMAT_LABEL: Record<SocialFormat, string> = { post: 'IG příspěvek', story: 'IG Story', tiktok: 'TikTok / Reels' };
export const TONE_LABEL: Record<SocialTone, string> = { hype: 'Hype / zápasový', fan: 'Fanouškovský', product: 'Produktový', behind: 'Zákulisí výroby' };

export interface SocialInput {
  club: string | null;
  clubHashtag?: string;
  slovak?: boolean;
  text: string;
  format: SocialFormat;
  tone: SocialTone;
  price: number;
  web: string;
  claim: string;
  seed: number;
}

export interface SocialIdeas {
  captions: string[];
  hooks: string[];
  visual: string[];
  hashtags: string;
}

const CAPTIONS: Record<SocialTone, string[]> = {
  hype: [
    'Zápasový den = {text} na ruce. 🏒🔥\n{clubLine}Upleteno z originálních voskovaných hokejových tkaniček, kovové koncovky, žádné kompromisy.\n👉 {web}',
    'Kdo jde dneska na zimák? 🙋‍♂️ {text} je připravený na buly.\n{clubLine}Každý kus pletu ručně – {price} Kč se 3 znaky v ceně.\n🔗 {web}',
    'Tribuna křičí, ruka nosí {text}. 💥\n{claim}\nObjednávky na {web} – vlastní text až 12 znaků.',
    'Třetí třetina, vyrovnaný stav, a ty máš na ruce {text}. Tohle se nevzdává. 🏒\n{clubLine}➡️ {web}',
  ],
  fan: [
    'Pro všechny, co fandí srdcem i v pondělí v kanclu. ❤️ {text}\n{clubLine}{claim}\n📦 {web}',
    'Fanoušek se nepozná podle dresu, ale podle detailů. 😉 {text} – ručně pletený z hokejových tkaniček.\n{clubLine}🔗 {web}',
    'Dárek pro tátu, bráchu, holku nebo sebe? {text} sedí každému, kdo žije hokejem. 🎁\n{clubLine}Od {price} Kč na {web}',
    'Na zimáku, v práci, ve škole. Nos svůj klub. Kdekoliv. 💙 {text}\n{clubLine}👉 {web}',
  ],
  product: [
    '{text} 🏒\n• originální voskované hokejové tkaničky\n• {clubColors}\n• kovové koncovky\n• 3 znaky v ceně {price} Kč, každý další +12 Kč (max 12)\n🛒 {web}',
    'Detail, na kterém záleží: vosková tkanička, pevný úplet, kovové koncovky. {text} ✔️\n{clubLine}Vlastní text až 12 znaků → {web}',
    'Nový kus z dílny: {text}. Ručně pletený, odolný, voděodolná vosková tkanička. 💧\n{clubLine}Cena od {price} Kč · {web}',
  ],
  behind: [
    'Jak vzniká {text}? Tkanička, korálky, trpělivost a hokej na pozadí. 🎧🏒\nKaždý kus pletu ručně u stolu.\n{clubLine}👉 {web}',
    'Ranní směna v dílně Offsidestore: {count} znaků, 2 koncovky, 1 hotový náramek. ☕️\n{clubLine}{web}',
    'Žádná fabrika. Jen já, stůl a stovky metrů hokejových tkaniček. {text} právě opouští dílnu. 📦\n{claim}\n{web}',
  ],
};

const HOOKS: Record<SocialFormat, string[]> = {
  post: [
    'Swipe → detail úpletu a koncovek',
    'Uhádneš klub podle barev? 👀',
    'Napiš do komentu, jaký text bys chtěl ty',
    'Označ kámoše, který tohle potřebuje',
  ],
  story: [
    'Anketa: {club} vs. soupeř – kdo vyhraje? 🗳️',
    'Otázka: „Jaký text bys dal na svůj náramek?“',
    'Odpočet do zápasu + sticker s odkazem na {web}',
    'Slide 1: detail tkaničky → Slide 2: korálky {text} → Slide 3: hotovo + link',
    'Kvíz: kolik metrů tkaničky padne na jeden náramek?',
  ],
  tiktok: [
    'POV: pleteš náramek pro fanouška {club} 🏒',
    'Tohle bylo kdysi v hokejové brusli…',
    'Plete se {text} – vydržíš až do konce?',
    '3 věci, které nevíš o hokejových tkaničkách',
    'Satisfying: 60 sekund pletení za 15 sekund ⏩',
  ],
};

const VISUAL: Record<SocialFormat, string[]> = {
  post: [
    'Náramek na ledě / na hokejce, ostrý detail korálků {text}, pozadí rozmazaný zimák.',
    'Flatlay: tkanička, korálky, kovové koncovky, hotový náramek – tmavé pozadí.',
    'Náramek na ruce držící permanentku nebo lístek na zápas {club}.',
  ],
  story: [
    'Vertikální video 5 s: ruka s náramkem {text} na tribuně, text přes video + link sticker.',
    'Foto z dílny: rozpracovaný kus ve fixaci, emoji 🔥 a anketa.',
    'Story s produktovou kartou (náhled vpravo) a CTA „Napiš DM“.',
  ],
  tiktok: [
    'Timelapse pletení od tkaničky po koncovky, trend zvuk, závěr: náramek na ruce s {text}.',
    'Transition: hokejová bota → vytažení tkaničky → střih → hotový náramek.',
    'Rozbalování objednávky: obálka, kartička, náramek {text} – reakce zákazníka.',
  ],
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

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function generateIdeas(i: SocialInput, clubColors = ''): SocialIdeas {
  const rand = rng(i.seed);
  const text = i.text.trim() || 'OFFSIDE';
  const fill = (t: string) =>
    t
      .replaceAll('{text}', text)
      .replaceAll('{club}', i.club ?? 'tvůj klub')
      .replaceAll('{clubLine}', i.club ? `V barvách: ${i.club}. ` + '\n' : '')
      .replaceAll('{clubColors}', clubColors ? `barvy: ${clubColors}` : 'barvy podle tvého klubu')
      .replaceAll('{web}', i.web)
      .replaceAll('{claim}', i.claim)
      .replaceAll('{price}', String(i.price))
      .replaceAll('{count}', String(Array.from(text.replace(/\s/g, '')).length))
      .replace(/\n{3,}/g, '\n\n');

  const tags = new Set<string>(['#offsidestore', '#hokej', '#hokejovynaramek', '#handmade', '#rucniprace', '#nossvujklub']);
  if (i.slovak) ['#slovenskyhokej', '#hokejslovensko'].forEach((t) => tags.add(t));
  else ['#ceskyhokej', '#extraliga'].forEach((t) => tags.add(t));
  if (i.clubHashtag) tags.add(i.clubHashtag);
  const textTag = slug(text);
  if (textTag.length >= 3) tags.add(`#${textTag}`);
  if (i.format === 'tiktok') ['#hockeytok', '#fyp', '#satisfying'].forEach((t) => tags.add(t));
  if (i.format === 'story') {
    // ve Stories méně hashtagů
    tags.clear();
    tags.add('#offsidestore');
    tags.add(i.clubHashtag ?? '#hokej');
  }

  return {
    captions: pick(CAPTIONS[i.tone], 3, rand).map(fill),
    hooks: pick(HOOKS[i.format], 3, rand).map(fill),
    visual: pick(VISUAL[i.format], 2, rand).map(fill),
    hashtags: [...tags].join(' '),
  };
}
