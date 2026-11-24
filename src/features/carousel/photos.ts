import { toDataUrl } from '../../lib/svgExport';
import { PRODUCT_ABBRS, productPhoto, type Slide } from './model';

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => res({ w: 0, h: 0 });
    img.src = src;
  });
}

export async function photoPatch(src: string, target: 1 | 2 = 1): Promise<Partial<Slide>> {
  const data = await toDataUrl(src);
  const { w, h } = await imageSize(data);
  if (target === 2) return { photo2: data, photo2W: w, photo2H: h };
  return { photo: data, photoW: w, photoH: h, focusX: 50, focusY: 50, zoom: 1 };
}

/** Dokumentární střih: celek → detail tkaničky → detail písmen → … */
const SHOTS = [
  { zoom: 1, focusX: 50, focusY: 40 },
  { zoom: 1.9, focusX: 15, focusY: 55 },
  { zoom: 1.5, focusX: 70, focusY: 30 },
  { zoom: 2.3, focusX: 45, focusY: 62 },
  { zoom: 1.25, focusX: 35, focusY: 50 },
];

/** Doplní slidům skutečné fotky náramku klubu z e-shopu (text slidy nechá černé). */
export async function withProductPhotos(slides: Slide[], abbr: string | undefined): Promise<Slide[]> {
  const code = abbr && PRODUCT_ABBRS.includes(abbr.toUpperCase()) ? abbr.toUpperCase() : 'LIT';
  const base = await photoPatch(productPhoto(code));
  return slides.map((s, i) => {
    if (s.style === 'text' || s.photo) return s;
    if (s.style === 'srovnani') return { ...s, ...base, zoom: 1.3, focusX: 50, focusY: 45 };
    if (s.style === 'promo') return { ...s, ...base, zoom: 1.1, focusX: 50, focusY: 30 };
    return { ...s, ...base, ...SHOTS[i % SHOTS.length] };
  });
}
