import { create } from 'zustand';
import { uid } from '../../lib/id';
import type { Club } from '../../types';

export type SlideStyle = 'dokument' | 'titulek' | 'meme' | 'text';
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
  dokument: 'Dokument (titulky)',
  titulek: 'Titulní slide',
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
  return { id: uid('sl'), style: 'dokument', photo: null, focusX: 50, focusY: 50, zoom: 1, photoW: 0, photoH: 0, kicker: '', text: '', text2: '', ...patch };
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
export const TEMPLATES: Template[] = [
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
