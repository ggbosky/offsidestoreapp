import { BRAND } from '../config';

/**
 * Logo Offsidestore – znak podle offsidestore.cz (svislá offside čára, dva puky).
 * Vlastní soubor: public/brand/ + BRAND.logoSrc v src/config.ts.
 */
export function Logo({ size = 'sm', showClaim = false }: { size?: 'sm' | 'lg'; showClaim?: boolean }) {
  const lg = size === 'lg';
  if (BRAND.logoSrc) {
    return (
      <div className={`flex items-center ${lg ? 'flex-col gap-4' : 'gap-3'}`}>
        <img src={BRAND.logoSrc} alt={BRAND.name} className={lg ? 'h-28 w-auto' : 'h-9 w-auto'} />
        {showClaim && <p className="text-muted">{BRAND.claim}</p>}
      </div>
    );
  }
  return (
    <div className={`flex items-center ${lg ? 'flex-col gap-5' : 'gap-2.5'}`}>
      <LogoMark className={lg ? 'h-24' : 'h-8'} />
      <div className={lg ? 'text-center' : ''}>
        <div className={`font-extrabold uppercase leading-none ${lg ? 'text-5xl tracking-[0.08em]' : 'text-lg tracking-[0.1em]'}`}>
          Offside<span className="text-brand">store</span>
        </div>
        {showClaim && <p className={`text-muted ${lg ? 'mt-3 text-lg' : 'text-xs'}`}>{BRAND.claim}</p>}
      </div>
    </div>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 701 1001" className={`w-auto ${className}`} aria-hidden>
      <rect x="293" y="0" width="115" height="1001" fill="currentColor" />
      <circle cx="125" cy="625" r="125" fill="currentColor" />
      <circle cx="575" cy="375" r="125" fill="#EC0016" />
    </svg>
  );
}
