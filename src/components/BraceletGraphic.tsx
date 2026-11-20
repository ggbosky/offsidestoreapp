import { useId } from 'react';
import type { EndcapFinish } from '../types';
import { splitChars } from '../lib/pricing';

const FINISH: Record<EndcapFinish, string[]> = {
  silver: ['#F4F6F8', '#B9C0C9', '#7D8590', '#D7DCE2', '#9AA2AC'],
  black: ['#5A5F67', '#2A2E34', '#121417', '#383D44', '#1A1D21'],
  gold: ['#FFF1C1', '#E3B95A', '#A9761E', '#F0CF7A', '#B8862F'],
  rose: ['#FBE0D6', '#E0A68F', '#A8664F', '#EBC0AE', '#B97A63'],
};

export const FINISH_LABEL: Record<EndcapFinish, string> = {
  silver: 'Stříbrná',
  black: 'Černá',
  gold: 'Zlatá',
  rose: 'Růžové zlato',
};

export const FINISH_SWATCH: Record<EndcapFinish, string> = {
  silver: 'linear-gradient(180deg,#F4F6F8,#7D8590 55%,#D7DCE2)',
  black: 'linear-gradient(180deg,#5A5F67,#121417 55%,#383D44)',
  gold: 'linear-gradient(180deg,#FFF1C1,#A9761E 55%,#F0CF7A)',
  rose: 'linear-gradient(180deg,#FBE0D6,#A8664F 55%,#EBC0AE)',
};

export interface BraceletGraphicProps {
  colors: string[];
  text: string;
  finish?: EndcapFinish;
  /** Délka pleteniny na každé straně (jednotky SVG). */
  sideLength?: number;
  className?: string;
  // pro vnoření do jiného SVG (náhled příspěvku)
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
}

const BEAD = 34;
const BEAD_GAP = 4;
const SPACE_W = 16;
const CAP_W = 30;
const H = 60;
const TOP = 16;
const BOT = 44;
const MID = 30;

/** Vektorový náhled náramku: splétaná tkanička v klubových barvách, korálky se znaky, kovové koncovky. */
export function BraceletGraphic({ colors, text, finish = 'silver', sideLength = 70, className, x, y, width, height }: BraceletGraphicProps) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cols = colors.length ? colors : ['#9BA3AF'];
  const chars = splitChars(text);
  const beadsW = chars.reduce((w, c) => w + (c.trim() === '' ? SPACE_W : BEAD + BEAD_GAP), 0) - (chars.length ? BEAD_GAP : 0);
  const pad = chars.length ? 10 : 0;
  const W = CAP_W * 2 + sideLength * 2 + beadsW + pad * 2;
  const bandStart = CAP_W - 4;
  const bandEnd = W - CAP_W + 4;
  const step = 11;
  const segCount = Math.ceil((bandEnd - bandStart) / step) + 2;
  const metal = FINISH[finish];

  let cursor = CAP_W + sideLength + pad;
  const beads = chars.map((c, i) => {
    if (c.trim() === '') {
      cursor += SPACE_W;
      return null;
    }
    const bx = cursor;
    cursor += BEAD + BEAD_GAP;
    return (
      <g key={i}>
        <rect x={bx} y={(H - BEAD) / 2 + 1.5} width={BEAD} height={BEAD} rx={6} fill="rgba(0,0,0,0.35)" />
        <rect x={bx} y={(H - BEAD) / 2} width={BEAD} height={BEAD} rx={6} fill={`url(#bead${rid})`} stroke="#8A929C" strokeWidth={0.8} />
        <text
          x={bx + BEAD / 2}
          y={H / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Oswald Variable', Oswald, Impact, 'Arial Narrow', sans-serif"
          fontWeight={700}
          fontSize={21}
          fill="#121417"
        >
          {c}
        </text>
      </g>
    );
  });

  const shade = (i: number) => (cols.length === 1 && i % 2 ? 0.22 : 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      x={x}
      y={y}
      width={width}
      height={height}
      role="img"
      aria-label={`Náramek ${text}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={`band${rid}`}>
          <rect x={bandStart} y={TOP} width={bandEnd - bandStart} height={BOT - TOP} rx={8} />
        </clipPath>
        <linearGradient id={`sheen${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.65" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`metal${rid}`} x1="0" y1="0" x2="0" y2="1">
          {metal.map((c, i) => (
            <stop key={i} offset={[0, 0.38, 0.52, 0.78, 1][i]} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`bead${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DADDE2" />
        </linearGradient>
      </defs>

      {/* Splétaná tkanička (rybí kost) */}
      <g clipPath={`url(#band${rid})`}>
        {Array.from({ length: segCount }, (_, i) => {
          const sx = bandStart - step + i * step;
          const up = cols[i % cols.length];
          const lo = cols[(i + (cols.length > 1 ? 1 : 0)) % cols.length];
          return (
            <g key={i}>
              <polygon points={`${sx},${TOP} ${sx + step},${TOP} ${sx + step + 7},${MID} ${sx + 7},${MID}`} fill={up} />
              <polygon points={`${sx},${TOP} ${sx + step},${TOP} ${sx + step + 7},${MID} ${sx + 7},${MID}`} fill="#000" opacity={shade(i)} />
              <polygon points={`${sx + 7},${MID} ${sx + step + 7},${MID} ${sx + step},${BOT} ${sx},${BOT}`} fill={lo} />
              <polygon points={`${sx + 7},${MID} ${sx + step + 7},${MID} ${sx + step},${BOT} ${sx},${BOT}`} fill="#000" opacity={shade(i + 1)} />
              <line x1={sx} y1={TOP} x2={sx + 7} y2={MID} stroke="#000" strokeOpacity="0.28" strokeWidth="1" />
              <line x1={sx + 7} y1={MID} x2={sx} y2={BOT} stroke="#000" strokeOpacity="0.28" strokeWidth="1" />
            </g>
          );
        })}
        <rect x={bandStart} y={TOP} width={bandEnd - bandStart} height={BOT - TOP} fill={`url(#sheen${rid})`} />
        <line x1={bandStart} y1={MID} x2={bandEnd} y2={MID} stroke="#000" strokeOpacity="0.2" strokeWidth="0.8" />
      </g>

      {beads}

      {/* Kovové koncovky */}
      {[0, W - CAP_W].map((cx, i) => (
        <g key={i}>
          <rect x={cx} y={11} width={CAP_W} height={38} rx={6} fill={`url(#metal${rid})`} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
          {[8, 15, 22].map((gx) => (
            <line key={gx} x1={cx + (i ? CAP_W - gx : gx)} y1={14} x2={cx + (i ? CAP_W - gx : gx)} y2={46} stroke="#000" strokeOpacity="0.18" strokeWidth="1" />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Malý barevný vzorek tkaničky (šikmé proužky). */
export function LaceSwatch({ colors, className = 'h-4 w-8' }: { colors: string[]; className?: string }) {
  const cols = colors.length ? colors : ['#9BA3AF'];
  const band = 5;
  const stops = cols.map((c, i) => `${c} ${i * band}px ${(i + 1) * band}px`).join(', ');
  return (
    <span
      className={`inline-block shrink-0 rounded-md ring-1 ring-white/15 ${className}`}
      style={{ backgroundImage: `repeating-linear-gradient(115deg, ${stops})` }}
      aria-hidden
    />
  );
}
