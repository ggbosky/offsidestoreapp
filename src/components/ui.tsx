import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onMouseDown={onClose}>
      <div
        className={`card w-full animate-pop ${wide ? 'max-w-4xl' : 'max-w-xl'}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="section-title">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Zavřít">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function NumberInput({ value, onChange, min, max, step = 1, className = '', suffix }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; className?: string; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        className={`input ${suffix ? 'pr-12' : ''} ${className}`}
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.target.value === '' ? 0 : Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        onFocus={(e) => e.target.select()}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">{suffix}</span>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'accent' | 'danger' | 'ok' }) {
  const color = { default: 'text-ink', accent: 'text-accent', danger: 'text-danger', ok: 'text-ok' }[tone];
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`font-display text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="text-ink-faint">{icon}</div>
      <div className="font-display text-lg uppercase tracking-wide">{title}</div>
      {children && <div className="max-w-md text-sm text-ink-muted">{children}</div>}
    </div>
  );
}
