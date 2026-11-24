import { forwardRef } from 'react';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { BRAND } from '../../config';

interface Props {
  vertical: boolean;
  color: string;
  text: string;
  title: string;
  subtitle: string;
  /** Meme ve stylu Jablkoňovny: velký text nahoře/dole přes fotku */
  meme?: { top: string; bottom: string } | null;
  /** Vlastní fotka (data URL) – pozadí memu */
  photo?: string | null;
}

/** Jednoduché zalomení textu na řádky podle počtu znaků. */
export function wrapLines(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line) line = w;
    else if ((line + ' ' + w).length <= maxChars) line += ' ' + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function MemeText({ text, x, y, anchorBottom, size, maxChars }: { text: string; x: number; y: number; anchorBottom?: boolean; size: number; maxChars: number }) {
  const lines = wrapLines(text.toUpperCase(), maxChars).slice(0, 4);
  const lh = size * 1.08;
  const startY = anchorBottom ? y - (lines.length - 1) * lh : y;
  return (
    <text x={x} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size} fill="#fff" stroke="#000" strokeWidth={size * 0.13} strokeLinejoin="round" paintOrder="stroke" letterSpacing={0.5}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} y={startY + i * lh}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

const FONT = "'Assistant Variable', Assistant, 'Arial Black', Arial, sans-serif";

/** Vizuál příspěvku ve stylu offsidestore.cz (tmavě červený přechod, bílé písmo). SVG → PNG. */
export const PostPreview = forwardRef<SVGSVGElement, Props>(function PostPreview({ vertical, color, text, title, subtitle, meme, photo }, ref) {
  const W = 1080;
  const H = vertical ? 1920 : 1350;
  const cy = H * 0.52;
  if (meme) {
    const size = vertical ? 92 : 84;
    return (
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl">
        <defs>
          <linearGradient id="mm-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1D1D22" />
            <stop offset="1" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="mm-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.45" />
            <stop offset="0.3" stopColor="#000" stopOpacity="0" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {photo ? (
          <image href={photo} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
        ) : (
          <>
            <rect width={W} height={H} fill="url(#mm-bg)" />
            <g transform={`rotate(-9 ${W / 2} ${cy})`}>
              <BraceletGraphic color={color} text={text} x={20} y={cy - 170} width={W - 40} height={340} sideLength={45} />
            </g>
          </>
        )}
        <rect width={W} height={H} fill="url(#mm-shade)" />
        {meme.top && <MemeText text={meme.top} x={W / 2} y={vertical ? 260 : 150} size={size} maxChars={vertical ? 16 : 19} />}
        {meme.bottom && <MemeText text={meme.bottom} x={W / 2} y={H - (vertical ? 300 : 130)} anchorBottom size={size} maxChars={vertical ? 16 : 19} />}
        <g transform={`translate(${W - 250} ${H - 62})`} opacity="0.9">
          <g transform="scale(0.035)">
            <rect x="293" y="0" width="115" height="1001" fill="#fff" />
            <circle cx="125" cy="625" r="125" fill="#fff" />
            <circle cx="575" cy="375" r="125" fill="#EC0016" />
          </g>
          <text x={34} y={28} fontFamily={FONT} fontWeight={800} fontSize={22} letterSpacing={2} fill="#fff" stroke="#000" strokeWidth={4} paintOrder="stroke">
            OFFSIDESTORE.CZ
          </text>
        </g>
      </svg>
    );
  }
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl">
      <defs>
        <linearGradient id="pp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B01E28" />
          <stop offset="1" stopColor="#340A0E" />
        </linearGradient>
        <radialGradient id="pp-v" cx="0.5" cy="0.55" r="0.7">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pp-bg)" />
      <rect width={W} height={H} fill="url(#pp-v)" />
      <rect x={W - 230} y={0} width={18} height={H} fill="#fff" opacity="0.08" />

      <g transform={`translate(80 ${vertical ? 170 : 90})`}>
        <g transform="scale(0.075)">
          <rect x="293" y="0" width="115" height="1001" fill="#fff" />
          <circle cx="125" cy="625" r="125" fill="#fff" />
          <circle cx="575" cy="375" r="125" fill="#EC0016" />
        </g>
        <text x={74} y={54} fontFamily={FONT} fontWeight={800} fontSize={40} letterSpacing={5} fill="#fff">
          OFFSIDESTORE
        </text>
      </g>

      <text x={80} y={cy - (vertical ? 420 : 330)} fontFamily={FONT} fontWeight={800} fontSize={vertical ? 120 : 108} fill="#fff" letterSpacing={1}>
        {title.toUpperCase()}
      </text>
      <text x={80} y={cy - (vertical ? 330 : 250)} fontFamily={FONT} fontWeight={600} fontSize={40} fill="#fff" opacity="0.75">
        {subtitle}
      </text>

      <g transform={`rotate(-9 ${W / 2} ${cy})`}>
        <BraceletGraphic color={color} text={text} x={20} y={cy - 170} width={W - 40} height={340} sideLength={45} />
      </g>

      <text x={80} y={cy + (vertical ? 400 : 330)} fontFamily={FONT} fontWeight={800} fontSize={58} fill="#fff">
        {BRAND.claim}
      </text>
      <rect x={80} y={H - (vertical ? 330 : 190)} width={440} height={92} rx={46} fill="#fff" />
      <text x={300} y={H - (vertical ? 270 : 130)} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill="#050505" letterSpacing={2}>
        {BRAND.web.toUpperCase()}
      </text>
    </svg>
  );
});

export async function downloadSvgAsPng(svg: SVGSVGElement, fileName: string) {
  const vb = svg.viewBox.baseVal;
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('Vizuál se nepodařilo vykreslit.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = vb.width;
    canvas.height = vb.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, vb.width, vb.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('PNG se nepodařilo vytvořit.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
