import { forwardRef } from 'react';
import type { EndcapFinish } from '../../types';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { BRAND } from '../../config';
import type { SocialFormat } from './generator';

interface Props {
  format: SocialFormat;
  colors: string[];
  text: string;
  title: string;
  accent: string;
  price: number;
  finish?: EndcapFinish;
}

const FONT = "'Oswald Variable', Oswald, Impact, 'Arial Narrow', sans-serif";
const SANS = "'Inter Variable', Inter, 'Segoe UI', Arial, sans-serif";

/** Náhled vizuálu příspěvku – čisté SVG, lze stáhnout jako PNG. */
export const PostPreview = forwardRef<SVGSVGElement, Props>(function PostPreview({ format, colors, text, title, accent, price, finish }, ref) {
  const W = 1080;
  const H = format === 'post' ? 1080 : 1920;
  const cy = H / 2;
  const stripes = colors.length ? colors : ['#9BA3AF'];
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl shadow-card">
      <defs>
        <radialGradient id="pp-glow" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor={accent} stopOpacity="0.28" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161A20" />
          <stop offset="1" stopColor="#0D0F12" />
        </linearGradient>
        <pattern id="pp-ice" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <line x1="0" y1="0" x2="0" y2="120" stroke="#fff" strokeOpacity="0.025" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#pp-bg)" />
      <rect width={W} height={H} fill="url(#pp-ice)" />
      <rect width={W} height={H} fill="url(#pp-glow)" />

      {/* klubové pruhy vlevo */}
      {stripes.map((c, i) => (
        <rect key={i} x={0} y={(H / stripes.length) * i} width={18} height={H / stripes.length} fill={c} />
      ))}

      {/* hlavička */}
      <text x={W / 2} y={format === 'post' ? 120 : 220} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} letterSpacing={8} fill="#F5F7FA">
        OFFSIDE<tspan fill={accent}>STORE</tspan>
      </text>
      <text x={W / 2} y={format === 'post' ? 170 : 275} textAnchor="middle" fontFamily={SANS} fontSize={30} fill="#9BA3AF">
        {BRAND.claim}
      </text>

      {/* titulek klubu */}
      <text x={W / 2} y={cy - (format === 'post' ? 170 : 300)} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={format === 'post' ? 96 : 120} fill="#F5F7FA" letterSpacing={4}>
        {title.toUpperCase()}
      </text>

      {/* náramek */}
      <g transform={`rotate(-8 ${W / 2} ${cy})`}>
        <BraceletGraphic colors={colors} text={text} finish={finish} x={60} y={cy - 160} width={W - 120} height={320} sideLength={80} />
      </g>

      {/* patička */}
      <text x={W / 2} y={cy + (format === 'post' ? 250 : 380)} textAnchor="middle" fontFamily={SANS} fontSize={34} fill="#9BA3AF">
        Ručně pletené z hokejových tkaniček · kovové koncovky
      </text>
      <rect x={W / 2 - 230} y={H - (format === 'post' ? 190 : 360)} width={460} height={96} rx={48} fill={accent} />
      <text x={W / 2} y={H - (format === 'post' ? 128 : 298)} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#0D0F12" letterSpacing={2}>
        {BRAND.web.toUpperCase()}
      </text>
      <text x={W / 2} y={H - (format === 'post' ? 50 : 200)} textAnchor="middle" fontFamily={SANS} fontSize={28} fill="#6B7380">
        od {price} Kč · 3 znaky v ceně · max 12
      </text>
    </svg>
  );
});

/** Převede SVG na PNG a stáhne ho. */
export async function downloadSvgAsPng(svg: SVGSVGElement, fileName: string) {
  const vb = svg.viewBox.baseVal;
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('SVG se nepodařilo vykreslit'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = vb.width;
    canvas.height = vb.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, vb.width, vb.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('PNG se nepodařilo vytvořit');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
