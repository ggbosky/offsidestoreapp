import { useId } from 'react';
import { splitChars } from '../lib/pricing';
import { luminance } from '../lib/color';

export interface BraceletGraphicProps {
  /** Barva tkaničky (jedna – náramek je z jedné tkaničky) */
  color: string;
  text: string;
  sideLength?: number;
  className?: string;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
}

const H = 80;
const BAND_T = 27;
const BAND_B = 53;
const STEP = 38;
const TIP = 26;

/** Plochá hokejová tkanička se vzorem a stříbrnými kovovými písmeny – jako na fotkách z offsidestore.cz. */
export function BraceletGraphic({ color, text, sideLength = 70, className, x, y, width, height }: BraceletGraphicProps) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const chars = splitChars(text);
  const lettersW = chars.length * STEP;
  const W = TIP * 2 + sideLength * 2 + lettersW;
  const light = luminance(color) > 0.35;
  const fleck = light ? 'rgba(10,10,10,0.75)' : 'rgba(255,255,255,0.55)';
  let cx = TIP + sideLength + STEP / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} x={x} y={y} width={width} height={height} role="img" aria-label={`Náramek ${text}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id={`fl${rid}`} width="22" height="26" patternUnits="userSpaceOnUse" y={BAND_T}>
          <rect x="1" y="8" width="5" height="3" rx="1" fill={fleck} />
          <rect x="12" y="15" width="5" height="3" rx="1" fill={fleck} />
          <rect x="7" y="15" width="3" height="3" rx="1" fill={fleck} opacity="0.6" />
          <rect x="17" y="8" width="3" height="3" rx="1" fill={fleck} opacity="0.6" />
        </pattern>
        <pattern id={`wv${rid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(55)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={light ? '#000' : '#fff'} strokeOpacity="0.12" strokeWidth="1.4" />
        </pattern>
        <linearGradient id={`sh${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`ag${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F5F7" />
          <stop offset="0.5" stopColor="#8B9098" />
          <stop offset="1" stopColor="#D5D8DD" />
        </linearGradient>
        <linearGradient id={`sv${rid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#C9CDD3" />
          <stop offset="0.55" stopColor="#8A9099" />
          <stop offset="0.8" stopColor="#E3E6EA" />
          <stop offset="1" stopColor="#A2A8B0" />
        </linearGradient>
        <filter id={`ds${rid}`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Tkanička */}
      <rect x={TIP - 2} y={BAND_T} width={W - 2 * TIP + 4} height={BAND_B - BAND_T} fill={color} />
      <rect x={TIP - 2} y={BAND_T} width={W - 2 * TIP + 4} height={BAND_B - BAND_T} fill={`url(#wv${rid})`} />
      <rect x={TIP - 2} y={BAND_T} width={W - 2 * TIP + 4} height={BAND_B - BAND_T} fill={`url(#fl${rid})`} />
      <rect x={TIP - 2} y={BAND_T} width={W - 2 * TIP + 4} height={BAND_B - BAND_T} fill={`url(#sh${rid})`} />
      <line x1={TIP} y1={BAND_T + 0.6} x2={W - TIP} y2={BAND_T + 0.6} stroke="#000" strokeOpacity="0.25" />
      <line x1={TIP} y1={BAND_B - 0.6} x2={W - TIP} y2={BAND_B - 0.6} stroke="#000" strokeOpacity="0.35" />

      {/* Kovové koncovky */}
      {[0, W - TIP].map((ax, i) => (
        <rect key={i} x={ax} y={BAND_T + 5} width={TIP} height={BAND_B - BAND_T - 10} rx={4} fill={`url(#ag${rid})`} stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />
      ))}

      {/* Stříbrná písmena */}
      {chars.map((c, i) => {
        const px = cx;
        cx += STEP;
        if (c.trim() === '') return null;
        return (
          <g key={i} filter={`url(#ds${rid})`}>
            <text
              x={px}
              y={H / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Assistant Variable', Assistant, 'Arial Black', Arial, sans-serif"
              fontWeight={700}
              fontSize={40}
              fill={`url(#sv${rid})`}
              stroke="#3E434A"
              strokeWidth={0.8}
              paintOrder="stroke"
            >
              {c}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Kulatý vzorek barvy tkaničky. */
export function LaceDot({ color, className = 'h-4 w-4' }: { color: string; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ring-1 ring-white/25 ${className}`} style={{ background: color }} aria-hidden />;
}
