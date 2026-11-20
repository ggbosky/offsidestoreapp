import { BRAND } from '../config';

/**
 * Logo Offsidestore.
 * Vlastní soubor: nahrajte do public/brand/ a nastavte BRAND.logoSrc v src/config.ts.
 */
export function Logo({ size = 'sm', showClaim = false }: { size?: 'sm' | 'lg'; showClaim?: boolean }) {
  const lg = size === 'lg';
  if (BRAND.logoSrc) {
    return (
      <div className="flex flex-col items-center">
        <img src={BRAND.logoSrc} alt={BRAND.name} className={lg ? 'h-28 w-auto' : 'h-9 w-auto'} />
        {showClaim && <p className="mt-3 text-sm text-ink-muted">{BRAND.claim}</p>}
      </div>
    );
  }
  return (
    <div className={`flex items-center ${lg ? 'flex-col gap-4' : 'gap-2.5'}`}>
      <LogoMark className={lg ? 'h-24 w-24' : 'h-9 w-9'} />
      <div className={lg ? 'text-center' : ''}>
        <div className={`font-display font-bold uppercase leading-none tracking-[0.08em] ${lg ? 'text-5xl' : 'text-xl'}`}>
          <span className="text-ink">Offside</span>
          <span className="text-accent">store</span>
        </div>
        {showClaim && <p className={`text-ink-muted ${lg ? 'mt-3 text-base tracking-wide' : 'text-xs'}`}>{BRAND.claim}</p>}
      </div>
    </div>
  );
}

/** Vektorový znak: puk s upleteným náramkem a kovovými koncovkami. */
export function LogoMark({ className = '' }: { className?: string }) {
  const segs = Array.from({ length: 6 }, (_, i) => i);
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-puck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232933" />
          <stop offset="1" stopColor="#0D0F12" />
        </linearGradient>
        <linearGradient id="lm-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F6F8" />
          <stop offset="0.45" stopColor="#8A929C" />
          <stop offset="0.75" stopColor="#DDE1E6" />
          <stop offset="1" stopColor="#9AA2AC" />
        </linearGradient>
        <clipPath id="lm-band">
          <rect x="17" y="27" width="30" height="10" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#lm-puck)" stroke="rgb(var(--accent))" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="rgba(245,247,250,0.08)" strokeWidth="1" />
      <g transform="rotate(-18 32 32)">
        <g clipPath="url(#lm-band)">
          {segs.map((i) => {
            const x = 15 + i * 6;
            return (
              <g key={i}>
                <polygon points={`${x},27 ${x + 6},27 ${x + 9},32 ${x + 3},32`} fill={i % 2 ? '#F5F7FA' : 'rgb(var(--accent))'} />
                <polygon points={`${x + 3},32 ${x + 9},32 ${x + 6},37 ${x},37`} fill={i % 2 ? 'rgb(var(--accent))' : '#F5F7FA'} />
              </g>
            );
          })}
        </g>
        <rect x="10" y="25.5" width="8" height="13" rx="2" fill="url(#lm-metal)" />
        <rect x="46" y="25.5" width="8" height="13" rx="2" fill="url(#lm-metal)" />
      </g>
    </svg>
  );
}
