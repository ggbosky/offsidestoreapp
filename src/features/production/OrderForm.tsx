import { useMemo, useState } from 'react';
import { AlertTriangle, Palette, Plus, Trash2 } from 'lucide-react';
import type { Order, OrderStatus, SalesChannel } from '../../types';
import { useData, type OrderInput } from '../../store/data';
import { BraceletGraphic, FINISH_SWATCH, LaceSwatch } from '../../components/BraceletGraphic';
import { Field, NumberInput } from '../../components/ui';
import { countChars, formatCzk, normalizeText, priceForChars, validateText } from '../../lib/pricing';
import { missingChars } from '../../lib/inventory';
import { CHANNELS, STATUS_META, STATUS_ORDER } from '../../lib/orders';
import { toast } from '../../store/toast';

type LaceMode = 'club' | 'stock' | 'free';

export function OrderForm({ order, onDone }: { order?: Order; onDone: () => void }) {
  const { clubs, laces, endcaps, chars, settings, addOrder, updateOrder } = useData();
  const p = settings.pricing;

  const [customer, setCustomer] = useState(order?.customer ?? '');
  const [channel, setChannel] = useState<SalesChannel>(order?.channel ?? 'web');
  const [mode, setMode] = useState<LaceMode>(order ? (order.clubId ? 'club' : order.laceId ? 'stock' : 'free') : 'club');
  const [clubId, setClubId] = useState<string | null>(order?.clubId ?? clubs[0]?.id ?? null);
  const [stockLaceId, setStockLaceId] = useState<string>(order?.laceId ?? laces.find((l) => !clubs.some((c) => c.laceId === l.id))?.id ?? laces[0]?.id ?? '');
  const [freeName, setFreeName] = useState(order?.customLace?.name ?? 'Vlastní barva');
  const [freeColors, setFreeColors] = useState<string[]>(order?.customLace?.colors ?? ['#16181C', '#F2F3F5']);
  const [text, setText] = useState(order?.text ?? '');
  const [endcapId, setEndcapId] = useState(order?.endcapId ?? endcaps[0]?.id ?? '');
  const [note, setNote] = useState(order?.note ?? '');
  const [discount, setDiscount] = useState(order ? order.listPrice - order.price : 0);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? 'new');
  const [touched, setTouched] = useState(false);

  const club = clubs.find((c) => c.id === clubId);
  const laceId = mode === 'club' ? club?.laceId ?? null : mode === 'stock' ? stockLaceId : null;
  const lace = laces.find((l) => l.id === laceId);
  const colors = mode === 'free' ? freeColors : lace?.colors ?? ['#6B7380'];

  const n = countChars(text);
  const listPrice = priceForChars(Math.max(n, 0), p);
  const validation = validateText(text, p);
  const missing = useMemo(() => missingChars(text, chars), [text, chars]);
  const endcap = endcaps.find((e) => e.id === endcapId);

  const input = (): OrderInput => ({
    customer,
    channel,
    clubId: mode === 'club' ? clubId : null,
    laceId,
    customLace: mode === 'free' ? { name: freeName.trim() || 'Vlastní barva', colors: freeColors } : undefined,
    text,
    endcapId,
    note,
    discount,
    status,
  });

  const canSave = validation.ok && (mode !== 'club' || !!club) && (mode !== 'stock' || !!lace) && !!endcapId;

  function save(addAnother: boolean) {
    setTouched(true);
    if (!canSave) return;
    if (order) {
      updateOrder(order.id, input());
      onDone();
      return;
    }
    const created = addOrder(input());
    toast(`Přidáno do fronty: ${created.number} · ${created.text}`);
    if (addAnother) {
      setText('');
      setNote('');
      setCustomer('');
      setTouched(false);
    } else onDone();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      className="grid gap-6 lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-5">
        {/* Tkanička */}
        <div>
          <div className="label">Barva tkaničky</div>
          <div className="mb-3 inline-flex rounded-xl border border-white/10 bg-ice-950/60 p-1 text-sm">
            {(
              [
                ['club', 'Klub'],
                ['stock', 'Barva ze skladu'],
                ['free', 'Vlastní (mimo sklad)'],
              ] as const
            ).map(([m, l]) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 font-semibold transition ${mode === m ? 'bg-accent text-ice-950' : 'text-ink-muted hover:text-ink'}`}>
                {l}
              </button>
            ))}
          </div>

          {mode === 'club' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {clubs.map((c) => {
                const cl = laces.find((l) => l.id === c.laceId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClubId(c.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${clubId === c.id ? 'border-accent bg-accent/10 text-ink' : 'border-white/10 bg-ice-950/50 text-ink-muted hover:border-white/25 hover:text-ink'}`}
                  >
                    <LaceSwatch colors={cl?.colors ?? []} className="h-5 w-7" />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {mode === 'stock' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {laces.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setStockLaceId(l.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${stockLaceId === l.id ? 'border-accent bg-accent/10' : 'border-white/10 bg-ice-950/50 text-ink-muted hover:border-white/25'}`}
                >
                  <LaceSwatch colors={l.colors} className="h-5 w-7" />
                  <span className="truncate">{l.name}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'free' && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-ice-950/40 p-4">
              <Field label="Název barvy">
                <input className="input" value={freeName} onChange={(e) => setFreeName(e.target.value)} />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                {freeColors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => setFreeColors(freeColors.map((x, j) => (j === i ? e.target.value : x)))}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                      aria-label={`Barva ${i + 1}`}
                    />
                    {freeColors.length > 1 && (
                      <button type="button" className="btn-icon" onClick={() => setFreeColors(freeColors.filter((_, j) => j !== i))} aria-label="Odebrat barvu">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {freeColors.length < 3 && (
                  <button type="button" className="btn-ghost py-2" onClick={() => setFreeColors([...freeColors, '#FFFFFF'])}>
                    <Palette size={15} /> Přidat barvu
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-faint">Tkanička mimo sklad se při dokončení neodečítá.</p>
            </div>
          )}
        </div>

        {/* Text */}
        <Field
          label={`Text náramku (${p.includedChars} znaky v ceně, max ${p.maxChars})`}
          hint="Mezery se nepočítají jako znak. Malá písmena se převedou na velká."
        >
          <div className="relative">
            <input
              className={`input py-3 pr-20 font-display text-2xl font-semibold tracking-[0.25em] ${touched && !validation.ok ? 'border-danger/70' : ''}`}
              value={text}
              onChange={(e) => setText(normalizeText(e.target.value))}
              placeholder="NAPŘ. LVT 1945"
              autoFocus={!order}
              maxLength={p.maxChars * 3}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold ${n > p.maxChars ? 'text-danger' : n > p.includedChars ? 'text-warn' : 'text-ink-muted'}`}>
              {n}/{p.maxChars}
            </span>
          </div>
        </Field>
        <div className="-mt-3 flex flex-wrap gap-1.5">
          {['♥', '★', '#', '-', '.', '&'].map((s) => (
            <button key={s} type="button" className="chip border-white/10 text-ink-muted hover:text-ink" onClick={() => setText(normalizeText(text + s))}>
              {s}
            </button>
          ))}
        </div>
        {touched && !validation.ok && <p className="-mt-2 text-sm text-danger">{validation.message}</p>}
        {missing.length > 0 && (
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-warn">
            <AlertTriangle size={14} /> Na skladě chybí / nestačí: {missing.join(' ')}
          </p>
        )}

        {/* Koncovky */}
        <div>
          <div className="label">Kovové koncovky</div>
          <div className="flex flex-wrap gap-2">
            {endcaps.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEndcapId(e.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${endcapId === e.id ? 'border-accent bg-accent/10' : 'border-white/10 bg-ice-950/50 text-ink-muted hover:border-white/25'}`}
              >
                <span className="h-5 w-3 rounded-sm ring-1 ring-black/40" style={{ backgroundImage: FINISH_SWATCH[e.finish] }} />
                {e.name}
                <span className={`text-xs ${e.qty < e.minQty ? 'text-danger' : 'text-ink-faint'}`}>{e.qty} ks</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zákazník">
            <input className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Jméno / přezdívka / @ig" />
          </Field>
          <Field label="Kanál">
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as SalesChannel)}>
              {Object.entries(CHANNELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Poznámka">
          <textarea className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dárek, termín, speciální požadavek…" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sleva na kus">
            <NumberInput value={discount} onChange={setDiscount} min={0} suffix="Kč" />
          </Field>
          {order && (
            <Field label="Stav">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Náhled a cena */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-white/[0.06] bg-ice-950/70 p-4">
          <div className="label">Náhled</div>
          <BraceletGraphic colors={colors} text={text || ' '} finish={endcap?.finish} className="w-full" />
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <LaceSwatch colors={colors} />
            <span className="truncate">{mode === 'club' ? club?.name : mode === 'stock' ? lace?.name : freeName}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-ice-950/70 p-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Základ (do {p.includedChars} znaků)</span>
            <span>{formatCzk(p.basePrice)}</span>
          </div>
          <div className="mt-1 flex justify-between text-ink-muted">
            <span>
              Znaky navíc {Math.max(0, n - p.includedChars)} × {p.extraCharPrice} Kč
            </span>
            <span>{formatCzk(Math.max(0, n - p.includedChars) * p.extraCharPrice)}</span>
          </div>
          {discount > 0 && (
            <div className="mt-1 flex justify-between text-ok">
              <span>Sleva</span>
              <span>−{formatCzk(discount)}</span>
            </div>
          )}
          <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
            <span className="text-ink-muted">Cena</span>
            <span className="font-display text-3xl font-semibold text-accent">{formatCzk(Math.max(0, listPrice - discount))}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn-primary py-3" disabled={touched && !canSave}>
            {order ? 'Uložit změny' : 'Přidat do fronty'}
          </button>
          {!order && (
            <button type="button" className="btn-ghost" onClick={() => save(true)}>
              <Plus size={16} /> Přidat a zadat další
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
