import { useData } from '../store/data';

/** Přepínač loga na vytvářených obrázcích – pamatuje si volbu. */
export function LogoToggle({ className = '', onChange }: { className?: string; onChange?: (on: boolean) => void }) {
  const on = useData((s) => s.settings.showLogo);
  const update = useData((s) => s.updateSettings);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        update({ showLogo: !on });
        onChange?.(!on);
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold transition ${on ? 'border-brand/60 text-white' : 'border-line-2 text-muted'} ${className}`}
      title={on ? 'Logo je na obrázku – kliknutím skryješ' : 'Logo je skryté – kliknutím zobrazíš'}
    >
      <span className={`relative h-4 w-7 rounded-full transition ${on ? 'bg-brand' : 'bg-line-2'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      Logo
    </button>
  );
}
