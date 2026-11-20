export type OrderStatus = 'new' | 'braiding' | 'ready' | 'shipped';

export type SalesChannel = 'web' | 'instagram' | 'tiktok' | 'osobne' | 'jine';

export type EndcapFinish = 'silver' | 'black' | 'gold' | 'rose';

/** Zásoba tkaniček jedné barevné kombinace (klubové nebo obecné). */
export interface LaceStock {
  id: string;
  name: string;
  /** 1–3 barvy (hex), které se v náramku střídají. */
  colors: string[];
  /** Zásoba v centimetrech. */
  stockCm: number;
  /** Spotřeba na jeden náramek (cm). */
  cmPerBracelet: number;
  /** Limit – pod tento počet náramků se zobrazí červené upozornění. */
  minBracelets: number;
}

export interface CharStock {
  char: string;
  qty: number;
}

export interface EndcapStock {
  id: string;
  name: string;
  finish: EndcapFinish;
  /** Počet kusů koncovek. */
  qty: number;
  minQty: number;
}

export interface Club {
  id: string;
  name: string;
  /** Zkratka pro náhledy, např. LIT, SPA. */
  short: string;
  /** Výchozí tkanička (barevná kombinace) klubu. */
  laceId: string;
  hashtag: string;
}

/** Barva tkaničky mimo sklad (jednorázová – neodečítá se). */
export interface CustomLace {
  name: string;
  colors: string[];
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  customer: string;
  channel: SalesChannel;
  clubId: string | null;
  /** Tkanička ze skladu; null = vlastní barva mimo sklad (customLace). */
  laceId: string | null;
  customLace?: CustomLace;
  text: string;
  endcapId: string;
  note: string;
  /** Ceníková cena v době vytvoření. */
  listPrice: number;
  /** Výsledná cena po slevě. */
  price: number;
  status: OrderStatus;
  /** true = materiál už byl odečten ze skladu. */
  materialDeducted: boolean;
  doneAt?: string;
  shippedAt?: string;
}

export interface PricingSettings {
  basePrice: number;
  includedChars: number;
  extraCharPrice: number;
  maxChars: number;
}

export interface CostSettings {
  /** Náklad na tkaničky pro 1 náramek (Kč). */
  lacePerBracelet: number;
  /** Náklad na 1 znak/korálek (Kč). */
  charEach: number;
  /** Náklad na 1 kovovou koncovku (Kč). */
  endcapEach: number;
  /** Obal, kartička, sáček… (Kč / ks). */
  packaging: number;
}

export interface Settings {
  pricing: PricingSettings;
  costs: CostSettings;
  endcapsPerBracelet: number;
  /** Limit pro upozornění u znaků (ks). */
  charMinQty: number;
  /** Akcentová barva brandu (hex). */
  accent: string;
  /** SHA-256 hash hesla nastavený v aplikaci (přebíjí výchozí). */
  passwordHash: string | null;
  /** Automatické zamčení po nečinnosti (minuty, 0 = vypnuto). */
  autoLockMinutes: number;
  lastBackupAt: string | null;
}

export interface AppData {
  schemaVersion: 1;
  orders: Order[];
  laces: LaceStock[];
  chars: CharStock[];
  endcaps: EndcapStock[];
  clubs: Club[];
  settings: Settings;
  orderSeq: number;
}
