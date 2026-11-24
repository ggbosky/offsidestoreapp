import { create } from 'zustand';
import { uid } from '../../lib/id';
import type { Club } from '../../types';

export type SlideStyle = 'titulek' | 'srovnani' | 'promo' | 'dokument' | 'meme' | 'text';
export type Grade = 'dokument' | 'teply' | 'cb' | 'zadny';

export interface Slide {
  id: string;
  style: SlideStyle;
  /** data URL fotky (nebo null = jen barva/grafika) */
  photo: string | null;
  /** posun výřezu fotky 0–100 % */
  focusX: number;
  focusY: number;
  /** přiblížení 1–2.5 */
  zoom: number;
  /** rozměry fotky (pro správný výřez) */
  photoW: number;
  photoH: number;
  /** druhá fotka (srovnání – dolní polovina); bez ní se použije první fotka černobíle */
  photo2: string | null;
  photo2W: number;
  photo2H: number;
  /** cena na promo slidu, např. „290 Kč“ */
  price: string;
  /** malý nadpis / místo a datum, např. „LITVÍNOV · LISTOPAD 2026“ */
  kicker: string;
  /** hlavní text (u memu horní) */
  text: string;
  /** druhý text (u memu dolní, u titulku podtitulek) */
  text2: string;
}

export interface CarouselSettings {
  vertical: boolean;
  grade: Grade;
  grain: boolean;
  showLogo: boolean;
  showCounter: boolean;
}

export const STYLE_LABEL: Record<SlideStyle, string> = {
  titulek: 'Info / titulní',
  srovnani: 'Srovnání',
  promo: 'Promo',
  dokument: 'Dokument (titulky)',
  meme: 'Meme',
  text: 'Jen text',
};

export const GRADE_LABEL: Record<Grade, string> = {
  dokument: 'Dokumentární',
  teply: 'Teplý film',
  cb: 'Černobílý',
  zadny: 'Bez úprav',
};

export function newSlide(patch: Partial<Slide> = {}): Slide {
  return { id: uid('sl'), style: 'dokument', photo: null, focusX: 50, focusY: 50, zoom: 1, photoW: 0, photoH: 0, photo2: null, photo2W: 0, photo2H: 0, price: '', kicker: '', text: '', text2: '', ...patch };
}

/** Fotka náramku z e-shopu (skutečný produkt) podle zkratky klubu. */
export const productPhoto = (abbr: string) => `./products/${abbr.toLowerCase()}.jpg`;
export const PRODUCT_ABBRS = ['LIT', 'SPA', 'PCE', 'JIH', 'VSE', 'ZLN', 'KOM', 'TRE', 'SLB', 'SLA', 'KLA', 'TRI'];

const MONTHS = ['LEDEN', 'ÚNOR', 'BŘEZEN', 'DUBEN', 'KVĚTEN', 'ČERVEN', 'ČERVENEC', 'SRPEN', 'ZÁŘÍ', 'ŘÍJEN', 'LISTOPAD', 'PROSINEC'];
const stamp = (place: string) => `${place.toUpperCase()} · ${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;

export interface Template {
  id: string;
  name: string;
  hint: string;
  build: (club: Club | undefined) => Slide[];
}

/** Šablony carouselů – dokumentární styl, fotka je hlavní. Fotky se doplní z e-shopu podle klubu. */
/** Srovnání ve stylu Jablkoňovny – nahoře vs. dole. {club}/{abbr} se doplní. */
export const COMPARISONS: Array<{ q: string; a: string; b: string }> = [
  { q: 'Jak ukázat, komu fandíš?', a: 'Dres: 2 500 Kč', b: 'Náramek {abbr}: 290 Kč' },
  { q: 'Fandění v roce…', a: '2013: šála po dědovi', b: '2026: tkanička z brusle' },
  { q: 'Léto, 35 °C', a: 'Šála na krku: peklo', b: 'Náramek {abbr}: v pohodě' },
  { q: 'Pondělí po zápase', a: 'Dres v práci: nejde', b: 'Náramek pod rukávem: jde' },
  { q: 'Tetování s klubem vs. náramek', a: 'Tetování: bolí a navždy', b: 'Náramek: nebolí a taky navždy' },
  { q: 'Tkanička z brusle', a: 'Včera: v brusli na ledě', b: 'Dnes: na zápěstí fanouška {club}' },
  { q: 'Dárek pro fanouška', a: 'Ponožky: zase', b: 'Náramek {abbr}: konečně' },
  { q: 'Cesta na zimák', a: 'Kšiltovka: zůstala doma', b: 'Náramek: nikdy nesundáváš' },
];

const fillClub = (t: string, c: Club | undefined) => t.replaceAll('{abbr}', c?.abbr ?? 'klubu').replaceAll('{club}', c?.short ?? 'tvého klubu');

/** Promo slide – vždy poslední. */
export const promoSlide = (c: Club | undefined, price = '290 Kč') =>
  newSlide({ style: 'promo', kicker: 'OFFSIDESTORE', text: c ? `Náramek ${c.abbr}` : 'Tvůj náramek', price, text2: '3 písmena v ceně · tkanička z brusle · offsidestore.cz' });

export const TEMPLATES: Template[] = [
  {
    id: 'srovnani-promo',
    name: 'Info → srovnání → promo',
    hint: 'Styl Jablkoňovny: 1 info slide, 3 srovnání, na konci promo s cenou',
    build: (c) => {
      const pick = [...COMPARISONS].sort(() => Math.random() - 0.5).slice(0, 3);
      return [
        newSlide({ style: 'titulek', kicker: c ? `${c.short.toUpperCase()} · OFFSIDESTORE` : 'OFFSIDESTORE', text: 'Komu fandíš, poznáš podle detailu', text2: 'Swipe a porovnej →' }),
        ...pick.map((p) => newSlide({ style: 'srovnani', kicker: fillClub(p.q, c), text: fillClub(p.a, c), text2: fillClub(p.b, c) })),
        promoSlide(c),
      ];
    },
  },
  {
    id: 'jak-vznika',
    name: 'Dokument: Jak vzniká',
    hint: '5 slidů – příběh náramku od tkaničky po ruku fanouška',
    build: (c) => [
      newSlide({ style: 'titulek', kicker: 'OFFSIDESTORE · DOKUMENT', text: `Jak vzniká náramek ${c?.abbr ?? ''}`.trim(), text2: 'Od brusle až na zápěstí.' }),
      newSlide({ kicker: stamp('Dílna'), text: 'Všechno začíná u tkaničky.', text2: 'Stejné, jaká drží brusli na noze. Snese pot, mráz i vodu.' }),
      newSlide({ kicker: stamp('Dílna'), text: `Barva podle dresu${c ? ` ${c.short}` : ''}.`, text2: 'Ne podle toho, co zbylo ve skladu.' }),
      newSlide({ kicker: stamp('Dílna'), text: `Písmena ${c?.abbr ?? ''} navlékáme ručně.`.replace('  ', ' '), text2: 'Nejsou nalepená ani potištěná. Nesetřou se.' }),
      newSlide({ style: 'text', text: 'Nos svůj klub. Kdekoliv.', text2: 'offsidestore.cz' }),
    ],
  },
  {
    id: 'tehdy-ted',
    name: 'Tehdy vs. teď',
    hint: '3 slidy – „2013 vs. 2026“, styl virálních srovnávaček',
    build: (c) => [
      newSlide({ style: 'titulek', kicker: '2013 vs. 2026', text: 'Ten čas tak letí', text2: `Fandění ${c?.short ?? 'tvého klubu'} kdysi a dnes.` }),
      newSlide({ style: 'dokument', kicker: '2013', text: 'Šála po dědovi.', text2: 'A hlasivky na tři dny v háji.', zoom: 1 }),
      newSlide({ style: 'dokument', kicker: '2026', text: `Tkanička z brusle a ${c?.abbr ?? 'zkratka'} na ruce.`, text2: 'Hlasivky pořád v háji.' }),
    ],
  },
  {
    id: 'meme',
    name: 'Meme',
    hint: '1 slide – velký text přes fotku',
    build: (c) => [newSlide({ style: 'meme', text: 'Babička: Zase utrácíš za ten hokej?', text2: `Já: Je to tkanička z brusle, babi. ${c?.abbr ?? ''}`.trim() })],
  },
  {
    id: 'fanousek',
    name: 'Příběh fanouška',
    hint: '4 slidy – dokumentární portrét zákazníka (se souhlasem)',
    build: (c) => [
      newSlide({ style: 'titulek', kicker: 'NOS SVŮJ KLUB · DÍL 1', text: 'Fanoušek, kterého znáš z tribuny', text2: c ? `${c.short} od malička.` : 'Od malička na zimáku.' }),
      newSlide({ kicker: stamp(c?.short ?? 'Zimák'), text: 'První zápas? S tátou, v jeho bundě.', text2: '' }),
      newSlide({ kicker: stamp(c?.short ?? 'Zimák'), text: 'Dneska nosí klub i do práce.', text2: 'Nenápadně. Na zápěstí.' }),
      newSlide({ style: 'text', text: 'Jaký je tvůj příběh?', text2: 'Napiš nám do DM – další díl může být o tobě.' }),
    ],
  },
  { id: 'prazdny', name: 'Prázdný', hint: 'Začni od nuly', build: () => [newSlide()] },
];

interface CarouselState {
  slides: Slide[];
  active: string;
  settings: CarouselSettings;
  set: (slides: Slide[], active?: string) => void;
  update: (id: string, patch: Partial<Slide>) => void;
  setActive: (id: string) => void;
  setSettings: (p: Partial<CarouselSettings>) => void;
}

/** Rozpracovaný carousel – drží se v paměti, dokud je aplikace otevřená. */
export const useCarousel = create<CarouselState>((set) => ({
  slides: [],
  active: '',
  settings: { vertical: false, grade: 'dokument', grain: true, showLogo: true, showCounter: true },
  set: (slides, active) => set({ slides, active: active ?? slides[0]?.id ?? '' }),
  update: (id, patch) => set((s) => ({ slides: s.slides.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  setActive: (active) => set({ active }),
  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
}));

/** Carousel z AI nápadu (slidy bez fotek – fotky doplní Tvorba podle klubu). */
export function slidesFromIdea(slides: Array<{ style: string; kicker: string; text: string; text2: string; price?: string }>): Slide[] {
  const allowed = new Set<SlideStyle>(['titulek', 'srovnani', 'promo', 'dokument', 'meme', 'text']);
  return slides.slice(0, 10).map((x) => newSlide({ style: allowed.has(x.style as SlideStyle) ? (x.style as SlideStyle) : 'dokument', kicker: x.kicker ?? '', text: x.text ?? '', text2: x.text2 ?? '', price: x.price ?? '' }));
}
