import latinUrl from '@fontsource-variable/assistant/files/assistant-latin-wght-normal.woff2?url';
import latinExtUrl from '@fontsource-variable/assistant/files/assistant-latin-ext-wght-normal.woff2?url';

/** Písmo Assistant jako data URL – aby exportované PNG vypadalo stejně jako náhled. */
let fontCss: Promise<string> | null = null;
function embeddedFontCss(): Promise<string> {
  if (!fontCss) {
    const toData = async (url: string) => {
      const blob = await (await fetch(url)).blob();
      return new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(blob);
      });
    };
    fontCss = Promise.all([toData(latinUrl), toData(latinExtUrl)])
      .then(([a, b]) =>
        [a, b]
          .map((src) => `@font-face{font-family:'Assistant Variable';font-weight:200 800;src:url(${src}) format('woff2');}`)
          .join(''),
      )
      .catch(() => '');
  }
  return fontCss;
}

/** Vykreslí SVG element do PNG (s vloženým písmem). */
export async function svgToPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const vb = svg.viewBox.baseVal;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(vb.width));
  clone.setAttribute('height', String(vb.height));
  const css = await embeddedFontCss();
  if (css) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = css;
    clone.insertBefore(style, clone.firstChild);
  }
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('Obrázek se nepodařilo vykreslit.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = vb.width;
    canvas.height = vb.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, vb.width, vb.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('PNG se nepodařilo vytvořit.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Načte obrázek (i z vlastní složky aplikace) jako data URL – nutné pro export. */
export async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const blob = await (await fetch(src)).blob();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('Fotku se nepodařilo načíst.'));
    r.readAsDataURL(blob);
  });
}

/** Měření šířky textu skutečným písmem (pro zalomení a podklady titulků). */
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
export function measure(text: string, size: number, weight = 700): number {
  if (!ctx) return text.length * size * 0.55;
  ctx.font = `${weight} ${size}px "Assistant Variable", Assistant, Arial, sans-serif`;
  return ctx.measureText(text).width;
}

export function wrapByWidth(text: string, size: number, maxWidth: number, weight = 700): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (!line || measure(next, size, weight) <= maxWidth) line = next;
      else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}
