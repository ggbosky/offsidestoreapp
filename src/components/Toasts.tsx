import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useToast } from '../store/toast';

const ICON = { ok: CheckCircle2, warn: AlertTriangle, error: XCircle, info: Info };
const TONE = { ok: 'border-ok/40 text-ok', warn: 'border-warn/40 text-warn', error: 'border-danger/50 text-danger', info: 'border-sky/40 text-sky' };

export function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex animate-pop items-start gap-3 rounded-xl border bg-surface-2/95 px-4 py-3 text-left text-sm shadow-card backdrop-blur ${TONE[t.kind]}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="text-ink">{t.text}</span>
          </button>
        );
      })}
    </div>
  );
}
