import { forwardRef, useId } from 'react';
import type { CarouselSettings, Slide } from './model';
import { measure, wrapByWidth } from '../../lib/svgExport';

const FONT = "'Assistant Variable', Assistant, 'Arial', sans-serif";
const W = 1080;

interface Props {
  slide: Slide;
  settings: CarouselSettings;
  index: number;
  total: number;
  className?: string;
}

/** Jeden slide carouselu jako SVG – dokumentární styl: fotka hlavní, titulky, filmové zrno. */
export const SlideSvg = forwardRef<SVGSVGElement, Props>(function SlideSvg({ slide, settings, index, total, className }, ref) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const H = settings.vertical ? 1920 : 1350;
  const s = slide;
  const isText = s.style === 'text';

  // výřez fotky (cover + zoom + posun)
  let img = null;
  if (s.style === 'srovnani') {
    img = <Split s={s} H={H} rid={rid} grade={settings.grade !== 'zadny'} />;
  } else if (s.photo && !isText) {
    const iw = s.photoW || W;
    const ih = s.photoH || H;
    const scale = Math.max(W / iw, H / ih) * s.zoom;
    const w = iw * scale;
    const h = ih * scale;
    const x = (W - w) * (s.focusX / 100);
    const y = (H - h) * (s.focusY / 100);
    img = <image href={s.photo} x={x} y={y} width={w} height={h} preserveAspectRatio="none" filter={settings.grade !== 'zadny' ? `url(#grade${rid})` : undefined} />;
  }

  const grade =
    settings.grade === 'cb'
      ? '0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0'
      : settings.grade === 'teply'
        ? '1.08 0.05 0 0 0.01  0.02 1.0 0 0 0  0 0 0.86 0 0  0 0 0 1 0'
        : '0.86 0.12 0.02 0 0  0.06 0.88 0.06 0 0  0.04 0.12 0.8 0 0  0 0 0 1 0';
  const slope = settings.grade === 'cb' ? 1.18 : 1.08;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className={className}>
      <defs>
        <filter id={`grade${rid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={grade} />
          <feComponentTransfer>
            <feFuncR type="linear" slope={slope} intercept={-(slope - 1) / 2} />
            <feFuncG type="linear" slope={slope} intercept={-(slope - 1) / 2} />
            <feFuncB type="linear" slope={slope} intercept={-(slope - 1) / 2} />
          </feComponentTransfer>
        </filter>
        <filter id={`bw${rid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={1.15} intercept={-0.06} />
            <feFuncG type="linear" slope={1.15} intercept={-0.06} />
            <feFuncB type="linear" slope={1.15} intercept={-0.06} />
          </feComponentTransfer>
        </filter>
        <clipPath id={`top${rid}`}>
          <rect x={0} y={0} width={W} height={H / 2} />
        </clipPath>
        <clipPath id={`bot${rid}`}>
          <rect x={0} y={H / 2} width={W} height={H / 2} />
        </clipPath>
        <linearGradient id={`promo${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0.92" />
        </linearGradient>
        <filter id={`grain${rid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={index + 3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id={`vig${rid}`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`shade${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={s.style === 'titulek' ? 0.85 : 0.5} />
        </linearGradient>
        <linearGradient id={`empty${rid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1D1D22" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <filter id={`sh${rid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* pozadí */}
      {isText ? <rect width={W} height={H} fill="#050505" /> : <rect width={W} height={H} fill={`url(#empty${rid})`} />}
      {img}
      {!isText && s.style !== 'srovnani' && <rect width={W} height={H} fill={`url(#${s.style === 'promo' ? 'promo' : 'shade'}${rid})`} />}
      {!isText && settings.grade !== 'zadny' && <rect width={W} height={H} fill={`url(#vig${rid})`} />}
      {settings.grain && <rect width={W} height={H} filter={`url(#grain${rid})`} opacity={isText ? 0.07 : 0.13} style={{ mixBlendMode: 'overlay' }} />}

      {s.style === 'dokument' && <Documentary s={s} H={H} vertical={settings.vertical} />}
      {s.style === 'titulek' && <Title s={s} H={H} vertical={settings.vertical} />}
      {s.style === 'meme' && <Meme s={s} H={H} vertical={settings.vertical} />}
      {s.style === 'text' && <TextSlide s={s} H={H} />}
      {s.style === 'srovnani' && <SplitLabels s={s} H={H} />}
      {s.style === 'promo' && <Promo s={s} H={H} vertical={settings.vertical} />}

      {settings.showLogo && (
        <g transform={`translate(48 ${settings.vertical ? 140 : 44})`} filter={`url(#sh${rid})`}>
          <g transform="scale(0.1)">
            <rect x="293" y="0" width="115" height="1001" fill="#fff" />
            <circle cx="125" cy="625" r="125" fill="#fff" />
            <circle cx="575" cy="375" r="125" fill="#EC0016" />
          </g>
        </g>
      )}
      {settings.showCounter && total > 1 && (
        <text x={W - 48} y={settings.vertical ? 190 : 92} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={30} fill="#fff" opacity={0.85} filter={`url(#sh${rid})`}>
          {index + 1}/{total}
        </text>
      )}
    </svg>
  );
});

/** Titulky jako v dokumentu: řádky s tmavým podkladem, dole uprostřed. */
function Documentary({ s, H, vertical }: { s: Slide; H: number; vertical: boolean }) {
  const main = s.text ? wrapByWidth(s.text, 52, 900, 700) : [];
  const sub = s.text2 ? wrapByWidth(s.text2, 38, 900, 500) : [];
  const lh1 = 70;
  const lh2 = 54;
  const bottom = H - (vertical ? 330 : 96);
  const total = main.length * lh1 + sub.length * lh2 + (sub.length && main.length ? 10 : 0);
  let y = bottom - total;
  const kickerY = y - 34;
  const rows: Array<{ t: string; size: number; weight: number; lh: number }> = [
    ...main.map((t) => ({ t, size: 52, weight: 700, lh: lh1 })),
    ...sub.map((t) => ({ t, size: 38, weight: 500, lh: lh2 })),
  ];
  return (
    <g fontFamily={FONT}>
      {s.kicker && (
        <g>
          <circle cx={W / 2 - measure(s.kicker, 26, 700) / 2 - 22 - 26 * 0.12} cy={kickerY - 9} r={7} fill="#EC0016" />
          <text x={W / 2 + 4} y={kickerY} textAnchor="middle" fontWeight={700} fontSize={26} letterSpacing={3} fill="#fff" stroke="#000" strokeWidth={4} strokeOpacity={0.35} paintOrder="stroke">
            {s.kicker.toUpperCase()}
          </text>
        </g>
      )}
      {rows.map((r, i) => {
        if (i === main.length && main.length) y += 10;
        const w = measure(r.t, r.size, r.weight) + 36;
        const top = y;
        y += r.lh;
        return (
          <g key={i}>
            <rect x={W / 2 - w / 2} y={top} width={w} height={r.lh - 6} rx={4} fill="#000" opacity={0.74} />
            <text x={W / 2} y={top + r.lh * 0.66} textAnchor="middle" fontWeight={r.weight} fontSize={r.size} fill="#fff">
              {r.t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Titulní slide: velký nadpis vlevo dole. */
function Title({ s, H, vertical }: { s: Slide; H: number; vertical: boolean }) {
  const head = s.text ? wrapByWidth(s.text, 104, 940, 800) : [];
  const sub = s.text2 ? wrapByWidth(s.text2, 40, 900, 500) : [];
  const bottom = H - (vertical ? 340 : 110);
  const subH = sub.length * 52;
  const headH = head.length * 104;
  const headTop = bottom - subH - (sub.length ? 26 : 0) - headH;
  return (
    <g fontFamily={FONT}>
      {s.kicker && (
        <>
          <rect x={64} y={headTop - 62} width={44} height={6} fill="#EC0016" />
          <text x={122} y={headTop - 50} fontWeight={700} fontSize={28} letterSpacing={4} fill="#fff">
            {s.kicker.toUpperCase()}
          </text>
        </>
      )}
      {head.map((t, i) => (
        <text key={i} x={60} y={headTop + 88 + i * 104} fontWeight={800} fontSize={104} fill="#fff" letterSpacing={-1}>
          {t}
        </text>
      ))}
      {sub.map((t, i) => (
        <text key={i} x={64} y={bottom - subH + 40 + i * 52} fontWeight={500} fontSize={40} fill="#fff" opacity={0.88}>
          {t}
        </text>
      ))}
    </g>
  );
}

function Meme({ s, H, vertical }: { s: Slide; H: number; vertical: boolean }) {
  const size = vertical ? 92 : 84;
  const block = (text: string, y: number, fromBottom: boolean) => {
    const lines = wrapByWidth(text.toUpperCase(), size, 940, 800).slice(0, 4);
    const lh = size * 1.08;
    const start = fromBottom ? y - (lines.length - 1) * lh : y;
    return (
      <text textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size} fill="#fff" stroke="#000" strokeWidth={size * 0.13} strokeLinejoin="round" paintOrder="stroke">
        {lines.map((l, i) => (
          <tspan key={i} x={W / 2} y={start + i * lh}>
            {l}
          </tspan>
        ))}
      </text>
    );
  };
  return (
    <g>
      {s.text && block(s.text, vertical ? 330 : 210, false)}
      {s.text2 && block(s.text2, H - (vertical ? 300 : 100), true)}
    </g>
  );
}

function TextSlide({ s, H }: { s: Slide; H: number }) {
  const lines = s.text ? wrapByWidth(s.text, 92, 900, 800) : [];
  const sub = s.text2 ? wrapByWidth(s.text2, 42, 900, 500) : [];
  const blockH = lines.length * 100 + (sub.length ? 40 + sub.length * 54 : 0);
  const top = (H - blockH) / 2;
  return (
    <g fontFamily={FONT}>
      <rect x={90} y={top - 70} width={56} height={8} fill="#EC0016" />
      {s.kicker && (
        <text x={162} y={top - 58} fontWeight={700} fontSize={28} letterSpacing={4} fill="#A3A3AA">
          {s.kicker.toUpperCase()}
        </text>
      )}
      {lines.map((t, i) => (
        <text key={i} x={86} y={top + 80 + i * 100} fontWeight={800} fontSize={92} fill="#fff" letterSpacing={-1}>
          {t}
        </text>
      ))}
      {sub.map((t, i) => (
        <text key={i} x={90} y={top + lines.length * 100 + 60 + i * 54} fontWeight={500} fontSize={42} fill="#A3A3AA">
          {t}
        </text>
      ))}
    </g>
  );
}

function cover(iw: number, ih: number, bx: number, by: number, bw: number, bh: number, zoom = 1, fx = 50, fy = 50) {
  const scale = Math.max(bw / (iw || bw), bh / (ih || bh)) * zoom;
  const w = (iw || bw) * scale;
  const h = (ih || bh) * scale;
  return { x: bx + (bw - w) * (fx / 100), y: by + (bh - h) * (fy / 100), width: w, height: h };
}

/** Srovnání: nahoře „jinde / tehdy“, dole „u nás / teď“. Bez druhé fotky je horní polovina černobílá. */
function Split({ s, H, rid, grade }: { s: Slide; H: number; rid: string; grade: boolean }) {
  const half = H / 2;
  const topSrc = s.photo;
  const botSrc = s.photo2 ?? s.photo;
  const botW = s.photo2 ? s.photo2W : s.photoW;
  const botH = s.photo2 ? s.photo2H : s.photoH;
  return (
    <g>
      <rect width={W} height={H} fill="#111" />
      {topSrc && (
        <g clipPath={`url(#top${rid})`}>
          <image href={topSrc} {...cover(s.photoW, s.photoH, 0, 0, W, half, s.zoom, s.focusX, s.focusY)} preserveAspectRatio="none" filter={s.photo2 ? (grade ? `url(#grade${rid})` : undefined) : `url(#bw${rid})`} />
        </g>
      )}
      {botSrc && (
        <g clipPath={`url(#bot${rid})`}>
          <image href={botSrc} {...cover(botW, botH, 0, half, W, half, s.photo2 ? 1 : s.zoom, s.photo2 ? 50 : s.focusX, s.photo2 ? 50 : s.focusY)} preserveAspectRatio="none" filter={grade ? `url(#grade${rid})` : undefined} />
        </g>
      )}
      <rect x={0} y={0} width={W} height={260} fill={`url(#splitTop${rid})`} />
      <defs>
        <linearGradient id={`splitTop${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.75" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={half - 4} width={W} height={8} fill="#fff" />
    </g>
  );
}

function Label({ text, x, y, red }: { text: string; x: number; y: number; red?: boolean }) {
  const lines = wrapByWidth(text, 54, 880, 800).slice(0, 2);
  const w = Math.max(...lines.map((l) => measure(l, 54, 800))) + 44;
  const h = lines.length * 66 + 22;
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} rx={6} fill={red ? '#EC0016' : '#000'} opacity={red ? 1 : 0.85} />
      {lines.map((l, i) => (
        <text key={i} x={x + 22} y={y - h + 64 + i * 66} fontFamily={FONT} fontWeight={800} fontSize={54} fill="#fff">
          {l}
        </text>
      ))}
    </g>
  );
}

function SplitLabels({ s, H }: { s: Slide; H: number }) {
  const half = H / 2;
  const q = s.kicker ? wrapByWidth(s.kicker, 46, 900, 800).slice(0, 2) : [];
  return (
    <g>
      {q.map((l, i) => (
        <text key={i} x={W / 2} y={150 + i * 56} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={46} fill="#fff">
          {l}
        </text>
      ))}
      {s.text && <Label text={s.text} x={48} y={half - 36} />}
      {s.text2 && <Label text={s.text2} x={48} y={H - 48} red />}
    </g>
  );
}

/** Promo: náramek, velká cena, odkaz. */
function Promo({ s, H, vertical }: { s: Slide; H: number; vertical: boolean }) {
  const bottom = H - (vertical ? 300 : 90);
  const sub = s.text2 ? wrapByWidth(s.text2, 34, 960, 500).slice(0, 2) : [];
  const head = s.text ? wrapByWidth(s.text, 84, 960, 800).slice(0, 2) : [];
  const ctaY = bottom;
  const subTop = ctaY - 110 - sub.length * 44;
  const priceY = subTop - 26;
  const headTop = priceY - (s.price ? 150 : 10) - head.length * 88;
  return (
    <g fontFamily={FONT}>
      {s.kicker && (
        <>
          <rect x={64} y={headTop - 58} width={44} height={6} fill="#EC0016" />
          <text x={122} y={headTop - 46} fontWeight={700} fontSize={28} letterSpacing={4} fill="#fff">
            {s.kicker.toUpperCase()}
          </text>
        </>
      )}
      {head.map((t, i) => (
        <text key={i} x={60} y={headTop + 74 + i * 88} fontWeight={800} fontSize={84} fill="#fff">
          {t}
        </text>
      ))}
      {s.price && (
        <text x={56} y={priceY} fontWeight={800} fontSize={150} fill="#EC0016" letterSpacing={-2} stroke="#000" strokeWidth={3} strokeOpacity={0.25} paintOrder="stroke">
          {s.price}
        </text>
      )}
      {sub.map((t, i) => (
        <text key={i} x={64} y={subTop + 36 + i * 44} fontWeight={500} fontSize={34} fill="#fff" opacity={0.88}>
          {t}
        </text>
      ))}
      <rect x={60} y={ctaY - 84} width={430} height={84} rx={42} fill="#fff" />
      <text x={275} y={ctaY - 30} textAnchor="middle" fontWeight={800} fontSize={36} letterSpacing={2} fill="#050505">
        OFFSIDESTORE.CZ
      </text>
    </g>
  );
}
