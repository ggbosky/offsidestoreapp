import { askConfirm } from '../../store/confirm';
import { useMemo, useState } from 'react';
import { ListPlus, Users, Zap } from 'lucide-react';
import { useData } from '../../store/data';
import { Field, NumberInput, Stat } from '../../components/ui';
import { BraceletGraphic, LaceSwatch } from '../../components/BraceletGraphic';
import { formatCzk, formatPct, normalizeText } from '../../lib/pricing';
import { quoteLines, quoteUniform, suggestedDiscountPct, type Quote } from '../../lib/quote';
import { materialCostPerBracelet } from '../../lib/inventory';
import { toast } from '../../store/toast';

export function CalculatorPage({ onGoToQueue }: { onGoToQueue: () => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
      <QuickCalc />
      <TeamOrder onGoToQueue={onGoToQueue} />
    </div>
  );
}

function QuoteSummary({ q }: { q: Quote }) {
  const tone = q.marginPct >= 60 ? 'ok' : q.marginPct >= 35 ? 'accent' : 'danger';
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ice-950/60 p-5">
      <div className="space-y-1.5 text-sm">
        <Row label={`Ceníková cena (${q.pieces} ks)`} value={formatCzk(q.subtotal)} />
        {q.discountAmount > 0 && <Row label="Sleva" value={`−${formatCzk(q.discountAmount)}`} cls="text-ok" />}
        <Row label="Materiál + obal (náklad)" value={`−${formatCzk(q.cost)}`} cls="text-ink-faint" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
        <Stat label="Zákazník zaplatí" value={formatCzk(q.total)} tone="accent" sub={q.pieces ? `${formatCzk(q.perPiece)} / ks` : undefined} />
        <Stat label="Hrubá marže" value={formatCzk(q.margin)} tone={tone} />
        <Stat label="Marže %" value={formatPct(q.marginPct)} tone={tone} sub="z ceny po slevě" />
      </div>
    </div>
  );
}

function Row({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div className={`flex justify-between ${cls || 'text-ink-muted'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// ───────────────────────── Rychlá kalkulace ─────────────────────────

function QuickCalc() {
  const settings = useData((s) => s.settings);
  const p = settings.pricing;
  const [pieces, setPieces] = useState(1);
  const [chars, setChars] = useState(p.includedChars);
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState<'pct' | 'czk'>('pct');

  const q = useMemo(() => quoteUniform(pieces, chars, discount, mode, settings), [pieces, chars, discount, mode, settings]);
  const suggested = suggestedDiscountPct(pieces);
  const unitCost = materialCostPerBracelet(chars, settings);

  return (
    <section className="card space-y-5 p-6">
      <div className="flex items-center gap-2">
        <Zap size={20} className="text-accent" />
        <h2 className="section-title">Rychlá kalkulace</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Počet kusů">
          <NumberInput value={pieces} onChange={(v) => setPieces(Math.max(0, v))} min={0} suffix="ks" />
        </Field>
        <Field label={`Znaků na kus (${p.includedChars} v ceně)`}>
          <NumberInput value={chars} onChange={(v) => setChars(Math.min(p.maxChars, Math.max(1, v)))} min={1} max={p.maxChars} suffix="zn." />
        </Field>
      </div>
      <input type="range" min={1} max={p.maxChars} value={chars} onChange={(e) => setChars(Number(e.target.value))} className="w-full accent-[rgb(var(--accent))]" aria-label="Počet znaků" />
      <div className="-mt-3 text-xs text-ink-faint">
        {Math.max(0, chars - p.includedChars)} znaků navíc × {p.extraCharPrice} Kč → {formatCzk(q.pieces ? q.subtotal / q.pieces : 0)} / ks · náklad {formatCzk(unitCost)} / ks
      </div>

      <div>
        <div className="label">Sleva</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <NumberInput value={discount} onChange={(v) => setDiscount(Math.max(0, v))} min={0} suffix={mode === 'pct' ? '%' : 'Kč'} />
          </div>
          <div className="inline-flex rounded-xl border border-white/10 bg-ice-950/60 p-1 text-sm">
            {(['pct', 'czk'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 font-semibold ${mode === m ? 'bg-accent text-ice-950' : 'text-ink-muted'}`}>
                {m === 'pct' ? '%' : 'Kč celkem'}
              </button>
            ))}
          </div>
          {[0, 5, 10, 15, 20].map((d) => (
            <button
              key={d}
              onClick={() => {
                setMode('pct');
                setDiscount(d);
              }}
              className={`chip ${mode === 'pct' && discount === d ? 'border-accent text-accent' : 'border-white/10 text-ink-muted hover:text-ink'}`}
            >
              {d} %
            </button>
          ))}
        </div>
        {suggested > 0 && (
          <p className="mt-2 text-xs text-ink-faint">
            Tip: pro {pieces} ks navrhuji množstevní slevu {suggested} %.{' '}
            <button
              className="font-semibold text-accent hover:underline"
              onClick={() => {
                setMode('pct');
                setDiscount(suggested);
              }}
            >
              Použít
            </button>
          </p>
        )}
      </div>

      <QuoteSummary q={q} />
      <p className="text-xs text-ink-faint">Náklady na materiál upravíte v Nastavení → Náklady.</p>
    </section>
  );
}

// ───────────────────────── Týmová objednávka ─────────────────────────

function TeamOrder({ onGoToQueue }: { onGoToQueue: () => void }) {
  const { clubs, laces, endcaps, settings, addOrders } = useData();
  const [laceId, setLaceId] = useState<string>(clubs[0]?.laceId ?? laces[0]?.id ?? '');
  const [endcapId, setEndcapId] = useState(endcaps[0]?.id ?? '');
  const [team, setTeam] = useState('');
  const [raw, setRaw] = useState('NOVÁK 17\nDVOŘÁK 9\nKAPITÁN C\nGÓLMAN 30\nJUNIOR 88');
  const [discountPct, setDiscountPct] = useState(10);
  const [note, setNote] = useState('');

  const texts = useMemo(() => raw.split('\n').map((l) => normalizeText(l).trim()).filter(Boolean), [raw]);
  const { lines, quote } = useMemo(() => quoteLines(texts, discountPct, settings), [texts, discountPct, settings]);
  const lace = laces.find((l) => l.id === laceId);
  const club = clubs.find((c) => c.laceId === laceId);
  const invalid = lines.filter((l) => !l.valid).length;

  async function addToQueue() {
    const valid = lines.filter((l) => l.valid);
    if (!valid.length) return;
    if (!(await askConfirm(`Přidat ${valid.length} ks do výrobní fronty?`))) return;
    addOrders(
      valid.map((l) => ({
        customer: team,
        channel: 'jine',
        clubId: club?.id ?? null,
        laceId,
        text: l.text,
        endcapId,
        note: [team && `Týmová objednávka: ${team}`, note].filter(Boolean).join(' · '),
        discount: l.listPrice - l.price,
      })),
    );
    toast(`Přidáno ${valid.length} ks do fronty.`);
    onGoToQueue();
  }

  return (
    <section className="card space-y-5 p-6">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-accent" />
        <h2 className="section-title">Týmová / klubová zakázka</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tým / zákazník">
          <input className="input" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="např. HC Junioři U15" />
        </Field>
        <Field label="Tkanička">
          <select className="input" value={laceId} onChange={(e) => setLaceId(e.target.value)}>
            <optgroup label="Kluby">
              {clubs.map((c) => (
                <option key={c.id} value={c.laceId}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Ostatní barvy">
              {laces
                .filter((l) => !clubs.some((c) => c.laceId === l.id))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Koncovky">
          <select className="input" value={endcapId} onChange={(e) => setEndcapId(e.target.value)}>
            {endcaps.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.qty} ks)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sleva na celou zakázku">
          <NumberInput value={discountPct} onChange={(v) => setDiscountPct(Math.min(100, Math.max(0, v)))} suffix="%" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Field label="Texty – jeden řádek = jeden náramek" hint={`Navržená sleva pro ${texts.length} ks: ${suggestedDiscountPct(texts.length)} %`}>
          <textarea className="input min-h-[220px] font-display text-lg tracking-widest" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </Field>
        <div className="max-h-[300px] overflow-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ice-850 text-left text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Text</th>
                <th className="px-3 py-2 text-right">Zn.</th>
                <th className="px-3 py-2 text-right">Cena</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className={`border-t border-white/[0.05] ${l.valid ? '' : 'bg-danger/10 text-danger'}`}>
                  <td className="px-3 py-1.5 text-ink-faint">{i + 1}</td>
                  <td className="px-3 py-1.5 font-display tracking-widest">{l.text}</td>
                  <td className="px-3 py-1.5 text-right">{l.chars}</td>
                  <td className="px-3 py-1.5 text-right">
                    {l.valid ? (
                      <>
                        {l.price !== l.listPrice && <span className="mr-1 text-xs text-ink-faint line-through">{l.listPrice}</span>}
                        {formatCzk(l.price)}
                      </>
                    ) : (
                      `max ${settings.pricing.maxChars}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lace && (
        <div className="flex items-center gap-3 rounded-xl bg-ice-950/50 p-3">
          <LaceSwatch colors={lace.colors} className="h-6 w-10" />
          <BraceletGraphic colors={lace.colors} text={texts[0] ?? ''} finish={endcaps.find((e) => e.id === endcapId)?.finish} sideLength={40} className="h-12 flex-1" />
        </div>
      )}

      <Field label="Poznámka k zakázce">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Termín, předání na tréninku…" />
      </Field>

      <QuoteSummary q={quote} />
      {invalid > 0 && <p className="text-sm text-danger">{invalid} řádků má víc než {settings.pricing.maxChars} znaků – do fronty se nepřidají.</p>}

      <button className="btn-primary w-full py-3" onClick={addToQueue} disabled={!quote.pieces}>
        <ListPlus size={18} /> Přidat {quote.pieces} ks do výrobní fronty
      </button>
    </section>
  );
}
