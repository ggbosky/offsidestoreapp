export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Relativní jas 0–1 (pro volbu kontrastního textu). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgbTriplet(hex).split(' ').map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const textOn = (hex: string) => (luminance(hex) > 0.45 ? '#0D0F12' : '#F5F7FA');

export function applyAccent(hex: string) {
  document.documentElement.style.setProperty('--accent', hexToRgbTriplet(hex));
}
