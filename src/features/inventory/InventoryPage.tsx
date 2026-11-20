import { useMemo, useState } from 'react';
import { AlertTriangle, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { EndcapFinish, EndcapStock, LaceStock } from '../../types';
import { useData } from '../../store/data';
import { FINISH_LABEL, FINISH_SWATCH, LaceSwatch } from '../../components/BraceletGraphic';
import { Field, Modal, NumberInput } from '../../components/ui';
import { braceletsPossible, queueDemand, stockAlerts } from '../../lib/inventory';
import { uid } from '../../lib/id';
import { toast } from '../../store/toast';

export function InventoryPage() {
  const data = useData();
  const alerts = useMemo(() => stockAlerts(data), [data]);
  const demand = useMemo(() => queueDemand(data), [data]);

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <section className="rounded-2xl border border-danger/40 bg-danger/10 p-5">
          <div className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide text-danger">
            <AlertTriangle size={20} /> Dochází materiál ({alerts.length})
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((a) => (
              <span key={`${a.kind}-${a.id}`} className="chip border-danger/40 bg-danger/10 text-danger">
                {a.label}: {a.current} {a.unit} <span className="opacity-70">(limit {a.limit})</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <LacesSection demand={demand.laceBracelets} />
      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <CharsSection demand={demand.chars} />
        <EndcapsSection demand={demand.endcaps} />
      </div>
    </div>
  );
}

// ───────────────────────── Tkaničky ─────────────────────────

function LacesSection({ demand }: { demand: Record<string, number> }) {
  const { laces, upsertLace, removeLace, addLaceStock, clubs } = useData();
  const [edit, setEdit] = useState<LaceStock | null>(null);
  const [restock, setRestock] = useState<LaceStock | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="section-title">Tkaničky</h2>
        <span className="text-sm text-ink-muted">přepočet na počet náramků, které ještě upletu</span>
        <button
          className="btn-ghost ml-auto py-2"
          onClick={() => setEdit({ id: uid('lace'), name: '', colors: ['#16181C'], stockCm: 0, cmPerBracelet: 90, minBracelets: 4 })}
        >
          <Plus size={16} /> Nová barva
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {laces.map((l) => {
          const n = braceletsPossible(l);
          const low = n < l.minBracelets;
          const inQueue = demand[l.id] ?? 0;
          const after = n - inQueue;
          const pct = Math.min(100, (n / Math.max(l.minBracelets * 3, 1)) * 100);
          const usedByClub = clubs.find((c) => c.laceId === l.id);
          return (
            <div key={l.id} className={`card p-4 ${low ? 'border-danger/50 bg-danger/[0.06]' : ''}`}>
              <div className="flex items-start gap-3">
                <LaceSwatch colors={l.colors} className="mt-1 h-8 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{l.name}</div>
                  <div className="text-xs text-ink-faint">
                    {l.stockCm} cm · {l.cmPerBracelet} cm / náramek
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-3xl font-semibold leading-none ${low ? 'text-danger' : 'text-ink'}`}>{n}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-faint">náramků</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={`h-full rounded-full ${low ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={low ? 'font-semibold text-danger' : 'text-ink-faint'}>
                  {low ? `Pod limitem (${l.minBracelets})!` : `Limit ${l.minBracelets} ks`}
                </span>
                {inQueue > 0 && <span className={after < 0 ? 'font-semibold text-danger' : 'text-ink-muted'}>Ve frontě {inQueue} ks → zbyde {after}</span>}
              </div>
              <div className="mt-3 flex items-center gap-1">
                <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => setRestock(l)}>
                  <Plus size={14} /> Naskladnit
                </button>
                <button className="btn-icon" onClick={() => setEdit(l)} title="Upravit">
                  <Pencil size={15} />
                </button>
                <button
                  className="btn-icon hover:text-danger"
                  title="Smazat"
                  onClick={() => {
                    if (usedByClub) return toast(`Tkaničku používá klub ${usedByClub.name} – nejdřív ho změňte v Nastavení.`, 'warn');
                    if (confirm(`Smazat tkaničku „${l.name}“?`)) removeLace(l.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit && laces.some((l) => l.id === edit.id) ? 'Upravit tkaničku' : 'Nová tkanička'}>
        {edit && (
          <LaceEditor
            lace={edit}
            onSave={(l) => {
              upsertLace(l);
              setEdit(null);
              toast('Tkanička uložena.');
            }}
          />
        )}
      </Modal>
      <Modal open={!!restock} onClose={() => setRestock(null)} title={`Naskladnit: ${restock?.name ?? ''}`}>
        {restock && (
          <RestockForm
            lace={restock}
            onSave={(cm) => {
              addLaceStock(restock.id, cm);
              setRestock(null);
              toast(`Naskladněno ${cm} cm (${restock.name}).`);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function LaceEditor({ lace, onSave }: { lace: LaceStock; onSave: (l: LaceStock) => void }) {
  const [l, setL] = useState(lace);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!l.name.trim()) return;
        onSave({ ...l, name: l.name.trim() });
      }}
    >
      <Field label="Název">
        <input className="input" value={l.name} onChange={(e) => setL({ ...l, name: e.target.value })} placeholder="např. Litvínov (modrá / červená)" autoFocus />
      </Field>
      <div>
        <div className="label">Barvy (1–3)</div>
        <div className="flex flex-wrap items-center gap-2">
          {l.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <input type="color" value={c} onChange={(e) => setL({ ...l, colors: l.colors.map((x, j) => (j === i ? e.target.value : x)) })} className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              {l.colors.length > 1 && (
                <button type="button" className="btn-icon" onClick={() => setL({ ...l, colors: l.colors.filter((_, j) => j !== i) })}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {l.colors.length < 3 && (
            <button type="button" className="btn-ghost py-2" onClick={() => setL({ ...l, colors: [...l.colors, '#FFFFFF'] })}>
              <Plus size={14} /> Barva
            </button>
          )}
          <LaceSwatch colors={l.colors} className="ml-2 h-8 w-14" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Zásoba">
          <NumberInput value={l.stockCm} onChange={(v) => setL({ ...l, stockCm: v })} suffix="cm" />
        </Field>
        <Field label="Spotřeba / ks">
          <NumberInput value={l.cmPerBracelet} onChange={(v) => setL({ ...l, cmPerBracelet: v })} min={1} suffix="cm" />
        </Field>
        <Field label="Limit">
          <NumberInput value={l.minBracelets} onChange={(v) => setL({ ...l, minBracelets: v })} min={0} suffix="ks" />
        </Field>
      </div>
      <button className="btn-primary w-full">Uložit</button>
    </form>
  );
}

function RestockForm({ lace, onSave }: { lace: LaceStock; onSave: (cm: number) => void }) {
  const [count, setCount] = useState(1);
  const [length, setLength] = useState(300);
  const cm = count * length;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (cm !== 0) onSave(cm);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Počet tkaniček">
          <NumberInput value={count} onChange={setCount} suffix="ks" />
        </Field>
        <Field label="Délka jedné tkaničky" hint="Hokejové tkaničky mají typicky 244–305 cm.">
          <NumberInput value={length} onChange={setLength} suffix="cm" />
        </Field>
      </div>
      <div className="rounded-xl bg-ice-950/60 p-4 text-sm text-ink-muted">
        Přibude <b className="text-ink">{cm} cm</b> ≈ <b className="text-accent">{Math.floor(cm / Math.max(1, lace.cmPerBracelet))} náramků</b>. Nový stav:{' '}
        {Math.floor((lace.stockCm + cm) / Math.max(1, lace.cmPerBracelet))} náramků.
      </div>
      <button className="btn-primary w-full">Naskladnit</button>
    </form>
  );
}

// ───────────────────────── Znaky ─────────────────────────

function CharsSection({ demand }: { demand: Record<string, number> }) {
  const { chars, setCharQty, addChar, removeChar, addToAllChars, settings } = useData();
  const [newChar, setNewChar] = useState('');
  const [newQty, setNewQty] = useState(20);
  const min = settings.charMinQty;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="section-title">Znaky / písmena</h2>
        <span className="text-sm text-ink-muted">limit {min} ks</span>
        <button className="btn-ghost ml-auto py-1.5 text-xs" onClick={() => confirm('Přidat +10 ks ke všem znakům?') && addToAllChars(10)}>
          +10 ke všem
        </button>
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
          {chars.map((c) => {
            const low = c.qty < min;
            const need = demand[c.char] ?? 0;
            return (
              <div key={c.char} className={`group relative rounded-xl border p-2 text-center ${low ? 'border-danger/50 bg-danger/10' : 'border-white/[0.07] bg-ice-950/50'}`}>
                <button
                  className="absolute right-1 top-1 hidden rounded p-0.5 text-ink-faint hover:text-danger group-hover:block"
                  onClick={() => confirm(`Odebrat znak „${c.char}“ ze skladu?`) && removeChar(c.char)}
                  title="Odebrat"
                >
                  <Trash2 size={11} />
                </button>
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-ink font-display text-xl font-bold text-ice-950">{c.char}</div>
                <input
                  type="number"
                  value={c.qty}
                  onChange={(e) => setCharQty(c.char, Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className={`mt-1.5 w-full bg-transparent text-center text-sm font-semibold focus:outline-none ${low ? 'text-danger' : 'text-ink'}`}
                  aria-label={`Počet znaku ${c.char}`}
                />
                <div className="flex items-center justify-center gap-1">
                  <button className="rounded p-0.5 text-ink-faint hover:bg-white/10 hover:text-ink" onClick={() => setCharQty(c.char, c.qty - 1)} aria-label="Ubrat">
                    <Minus size={12} />
                  </button>
                  <button className="rounded p-0.5 text-ink-faint hover:bg-white/10 hover:text-ink" onClick={() => setCharQty(c.char, c.qty + 1)} aria-label="Přidat">
                    <Plus size={12} />
                  </button>
                </div>
                {need > 0 && <div className={`mt-0.5 text-[10px] ${need > c.qty ? 'font-bold text-danger' : 'text-ink-faint'}`}>fronta {need}</div>}
              </div>
            );
          })}
        </div>
        <form
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/[0.06] pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newChar.trim()) return;
            addChar(newChar, newQty);
            toast(`Znak „${newChar.toLocaleUpperCase('cs-CZ')}“ naskladněn (+${newQty}).`);
            setNewChar('');
          }}
        >
          <Field label="Znak" className="w-24">
            <input className="input text-center font-display text-lg" value={newChar} maxLength={2} onChange={(e) => setNewChar(e.target.value)} placeholder="Ř" />
          </Field>
          <Field label="Počet" className="w-28">
            <NumberInput value={newQty} onChange={setNewQty} suffix="ks" />
          </Field>
          <button className="btn-ghost">
            <Plus size={16} /> Přidat / naskladnit
          </button>
        </form>
      </div>
    </section>
  );
}

// ───────────────────────── Koncovky ─────────────────────────

function EndcapsSection({ demand }: { demand: Record<string, number> }) {
  const { endcaps, upsertEndcap, removeEndcap, settings } = useData();
  const perB = settings.endcapsPerBracelet;
  const [edit, setEdit] = useState<EndcapStock | null>(null);
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="section-title">Kovové koncovky</h2>
        <button className="btn-ghost ml-auto py-1.5 text-xs" onClick={() => setEdit({ id: uid('endcap'), name: '', finish: 'silver', qty: 0, minQty: 10 })}>
          <Plus size={14} /> Nový typ
        </button>
      </div>
      <div className="space-y-2">
        {endcaps.map((e) => {
          const low = e.qty < e.minQty;
          const need = demand[e.id] ?? 0;
          return (
            <div key={e.id} className={`card flex items-center gap-3 p-3 ${low ? 'border-danger/50 bg-danger/[0.06]' : ''}`}>
              <span className="h-10 w-5 shrink-0 rounded-md ring-1 ring-black/50" style={{ backgroundImage: FINISH_SWATCH[e.finish] }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{e.name}</div>
                <div className={`text-xs ${low ? 'text-danger' : 'text-ink-faint'}`}>
                  limit {e.minQty} ks{need > 0 && ` · fronta potřebuje ${need} ks`}
                </div>
              </div>
              <button className="btn-icon" onClick={() => upsertEndcap({ ...e, qty: e.qty - perB })} title={`−${perB} (jeden náramek)`}>
                <Minus size={15} />
              </button>
              <div className={`w-14 text-center font-display text-2xl font-semibold ${low ? 'text-danger' : ''}`}>{e.qty}</div>
              <button className="btn-icon" onClick={() => upsertEndcap({ ...e, qty: e.qty + perB })} title={`+${perB}`}>
                <Plus size={15} />
              </button>
              <button className="btn-icon" onClick={() => setEdit(e)} title="Upravit / naskladnit">
                <Pencil size={15} />
              </button>
              <button className="btn-icon hover:text-danger" onClick={() => confirm(`Smazat „${e.name}“?`) && removeEndcap(e.id)} title="Smazat">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Koncovky">
        {edit && (
          <EndcapEditor
            endcap={edit}
            onSave={(e) => {
              upsertEndcap(e);
              setEdit(null);
              toast('Koncovky uloženy.');
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function EndcapEditor({ endcap, onSave }: { endcap: EndcapStock; onSave: (e: EndcapStock) => void }) {
  const [e, setE] = useState(endcap);
  const [add, setAdd] = useState(0);
  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!e.name.trim()) return;
        onSave({ ...e, name: e.name.trim(), qty: e.qty + add });
      }}
    >
      <Field label="Název">
        <input className="input" value={e.name} onChange={(ev) => setE({ ...e, name: ev.target.value })} autoFocus />
      </Field>
      <div>
        <div className="label">Povrch</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FINISH_LABEL) as EndcapFinish[]).map((f) => (
            <button type="button" key={f} onClick={() => setE({ ...e, finish: f })} className={`chip ${e.finish === f ? 'border-accent text-ink' : 'border-white/10 text-ink-muted'}`}>
              <span className="h-4 w-2.5 rounded-sm" style={{ backgroundImage: FINISH_SWATCH[f] }} /> {FINISH_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Stav">
          <NumberInput value={e.qty} onChange={(v) => setE({ ...e, qty: v })} suffix="ks" />
        </Field>
        <Field label="Naskladnit +">
          <NumberInput value={add} onChange={setAdd} suffix="ks" />
        </Field>
        <Field label="Limit">
          <NumberInput value={e.minQty} onChange={(v) => setE({ ...e, minQty: v })} suffix="ks" />
        </Field>
      </div>
      <button className="btn-primary w-full">Uložit</button>
    </form>
  );
}
