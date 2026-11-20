import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, PartyPopper, StickyNote, X } from 'lucide-react';
import { useData } from '../../store/data';
import { BraceletGraphic, FINISH_SWATCH } from '../../components/BraceletGraphic';
import { splitChars, countChars } from '../../lib/pricing';
import { clubName, resolveLace } from '../../lib/orders';
import { changeStatus } from './actions';
import { textOn } from '../../lib/color';

/**
 * Režim u stolu – celá obrazovka, obří znaky v přesném pořadí.
 * Klávesy: Enter = hotovo a další, ← → = listování, Esc = zavřít.
 */
export function BraidingMode({ ids, startIndex = 0, title, onClose }: { ids: string[]; startIndex?: number; title?: string; onClose: () => void }) {
  const orders = useData((s) => s.orders);
  const laces = useData((s) => s.laces);
  const clubs = useData((s) => s.clubs);
  const endcaps = useData((s) => s.endcaps);
  const settings = useData((s) => s.settings);
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(ids.length - 1, 0)));
  const [reversed, setReversed] = useState(false);
  const [finished, setFinished] = useState(false);

  const queue = useMemo(() => ids.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as typeof orders, [ids, orders]);
  const order = queue[index];
  const doneCount = queue.filter((o) => o.status === 'ready' || o.status === 'shipped').length;

  // Fullscreen při otevření
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    };
  }, []);

  // Otevřený kus automaticky přepnout do stavu „V pletení“
  useEffect(() => {
    if (order && order.status === 'new') changeStatus(order.id, 'braiding', { silent: true });
  }, [order?.id]);

  function done() {
    if (!order) return;
    if (order.status !== 'ready' && order.status !== 'shipped') changeStatus(order.id, 'ready');
    // další nedokončený kus (nejdřív dopředu, pak od začátku)
    const isOpen = (i: number) => i !== index && queue[i] && queue[i].status !== 'ready' && queue[i].status !== 'shipped';
    for (let i = index + 1; i < queue.length; i++) if (isOpen(i)) return setIndex(i);
    for (let i = 0; i < index; i++) if (isOpen(i)) return setIndex(i);
    setFinished(true);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (finished) return;
      else if (e.key === 'Enter') {
        e.preventDefault();
        done();
      } else if (e.key === 'ArrowRight') setIndex((i) => Math.min(queue.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!order || finished) {
    return (
      <Overlay>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <PartyPopper size={72} className="text-accent" />
          <h2 className="font-display text-5xl font-bold uppercase tracking-wide">Série hotová!</h2>
          <p className="text-lg text-ink-muted">{doneCount} ks je připraveno k odeslání. Dobrá práce.</p>
          <button className="btn-primary px-8 py-4 text-lg" onClick={onClose} autoFocus>
            Zpět do fronty
          </button>
        </div>
      </Overlay>
    );
  }

  const lace = resolveLace(order, { laces });
  const club = clubName(order, { clubs });
  const endcap = endcaps.find((e) => e.id === order.endcapId);
  const chars = splitChars(order.text);
  const tiles = chars.map((c, i) => ({ c, i }));
  const shown = reversed ? [...tiles].reverse() : tiles;
  let num = 0;
  const isDone = order.status === 'ready' || order.status === 'shipped';

  return (
    <Overlay>
      {/* Horní lišta */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] px-8 py-4">
        <div className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-accent">Režim u stolu</div>
        {title && <div className="text-sm text-ink-muted">{title}</div>}
        <div className="ml-auto flex items-center gap-3 text-sm text-ink-muted">
          <span>
            Kus <b className="text-ink">{index + 1}</b> z {queue.length} · hotovo {doneCount}
          </span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accent transition-all" style={{ width: `${(doneCount / queue.length) * 100}%` }} />
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} title="Zavřít (Esc)">
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-8 py-6">
        {/* Hlavička kusu */}
        <div className="text-center">
          <div className="font-mono text-sm text-ink-faint">
            {order.number} · {order.customer || 'bez jména'}
          </div>
          <div className="mt-1 font-display text-4xl font-bold uppercase tracking-wide">{club ?? lace.name}</div>
        </div>

        {/* Tkanička */}
        <div className="flex w-full max-w-5xl flex-col items-center gap-4">
          <BraceletGraphic colors={lace.colors} text="" finish={endcap?.finish} sideLength={260} className="w-full max-w-3xl" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {lace.colors.map((c, i) => (
              <span key={i} className="rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-white/20" style={{ background: c, color: textOn(c) }}>
                Barva {i + 1}
              </span>
            ))}
            <span className="text-lg font-semibold text-ink-muted">{lace.name}</span>
          </div>
        </div>

        {/* Znaky – obří, s pořadím */}
        <div className="flex max-w-full flex-wrap items-end justify-center gap-3">
          {shown.map(({ c, i }) => {
            if (c.trim() === '') {
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="braid-char flex w-10 items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-transparent">·</div>
                  <div className="text-xs uppercase tracking-wider text-ink-faint">mezera</div>
                </div>
              );
            }
            num += 1;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="braid-char flex min-w-[1.1em] items-center justify-center rounded-2xl bg-ink px-[0.12em] py-[0.08em] font-display font-bold text-ice-950 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
                  {c}
                </div>
                <div className="font-display text-xl font-semibold text-accent">{num}.</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-ink-muted">
          <span>{countChars(order.text)} znaků</span>
          <span>·</span>
          <button className="chip border-white/15 text-ink hover:border-accent" onClick={() => setReversed((r) => !r)}>
            <ArrowLeftRight size={13} /> Navlékat {reversed ? 'zprava doleva' : 'zleva doprava'}
          </button>
          {endcap && (
            <>
              <span>·</span>
              <span className="flex items-center gap-2">
                <span className="h-5 w-3 rounded-sm" style={{ backgroundImage: FINISH_SWATCH[endcap.finish] }} />
                Koncovky: <b className="text-ink">{endcap.name}</b> × {settings.endcapsPerBracelet}
              </span>
            </>
          )}
        </div>

        {order.note && (
          <div className="flex max-w-3xl items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 px-5 py-4 text-lg text-warn">
            <StickyNote className="mt-1 shrink-0" />
            {order.note}
          </div>
        )}
      </div>

      {/* Ovládání */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 border-t border-white/[0.06] px-8 py-5">
        <button className="btn-ghost py-5 text-lg" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft /> Předchozí
        </button>
        <button className="btn-primary py-5 text-xl" onClick={done}>
          <Check size={26} /> {isDone ? 'Už hotovo – další kus' : 'Hotovo – další kus'}
          <kbd className="ml-2 rounded bg-ice-950/20 px-2 py-0.5 text-xs font-semibold">Enter</kbd>
        </button>
        <button className="btn-ghost py-5 text-lg" onClick={() => setIndex((i) => Math.min(queue.length - 1, i + 1))} disabled={index >= queue.length - 1}>
          Přeskočit <ChevronRight />
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="ice-bg fixed inset-0 z-50 flex animate-fade flex-col">{children}</div>;
}
