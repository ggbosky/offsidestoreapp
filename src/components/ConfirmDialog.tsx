import { useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { useConfirm } from '../store/confirm';

export function ConfirmDialog() {
  const { message, close } = useConfirm();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!message) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [message, close]);

  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => close(false)}>
      <div className="card w-full max-w-md animate-pop p-6" role="alertdialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex gap-3">
          <HelpCircle className="mt-0.5 shrink-0 text-brand" size={22} />
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => close(false)}>
            Zrušit
          </button>
          <button ref={okRef} className="btn-primary" onClick={() => close(true)}>
            Potvrdit
          </button>
        </div>
      </div>
    </div>
  );
}
