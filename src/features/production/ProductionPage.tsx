import { useMemo, useState } from 'react';
import { Hand, Layers, Plus, Search, Spool } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { useData } from '../../store/data';
import { LaceSwatch } from '../../components/BraceletGraphic';
import { Empty, Modal } from '../../components/ui';
import { formatCzk } from '../../lib/pricing';
import { STATUS_META, STATUS_ORDER, queueSort, resolveLace } from '../../lib/orders';
import { OPEN_STATUSES } from '../../lib/inventory';
import { toast } from '../../store/toast';
import { OrderCard } from './OrderCard';
import { OrderForm } from './OrderForm';
import { BraidingMode } from './BraidingMode';

type StatusFilter = 'active' | 'all' | OrderStatus;

export function ProductionPage() {
  const orders = useData((s) => s.orders);
  const laces = useData((s) => s.laces);
  const clubs = useData((s) => s.clubs);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [laceFilter, setLaceFilter] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<{ order?: Order } | null>(null);
  const [braid, setBraid] = useState<{ ids: string[]; start: number; title?: string } | null>(null);

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { new: 0, braiding: 0, ready: 0, shipped: 0 };
    orders.forEach((o) => (c[o.status] += 1));
    return c;
  }, [orders]);

  const openValue = useMemo(() => orders.filter((o) => o.status !== 'shipped').reduce((s, o) => s + o.price, 0), [orders]);

  // Barvy tkaniček v otevřených objednávkách (pro filtr sérií)
  const laceGroups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; colors: string[]; open: number }>();
    for (const o of orders) {
      if (!OPEN_STATUSES.has(o.status)) continue;
      const l = resolveLace(o, { laces });
      const g = map.get(l.key) ?? { key: l.key, name: l.name, colors: l.colors, open: 0 };
      g.open += 1;
      map.set(l.key, g);
    }
    return [...map.values()].sort((a, b) => b.open - a.open);
  }, [orders, laces]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('cs');
    return orders
      .filter((o) => (statusFilter === 'all' ? true : statusFilter === 'active' ? o.status !== 'shipped' : o.status === statusFilter))
      .filter((o) => !laceFilter || resolveLace(o, { laces }).key === laceFilter)
      .filter((o) => {
        if (!needle) return true;
        const club = clubs.find((c) => c.id === o.clubId)?.name ?? '';
        return [o.text, o.customer, o.number, o.note, club].join(' ').toLocaleLowerCase('cs').includes(needle);
      })
      .sort(queueSort);
  }, [orders, statusFilter, laceFilter, q, laces, clubs]);

  const sections = useMemo(() => {
    if (!grouped) return [{ key: 'all', name: '', colors: [] as string[], items: filtered }];
    const map = new Map<string, { key: string; name: string; colors: string[]; items: Order[] }>();
    for (const o of filtered) {
      const l = resolveLace(o, { laces });
      const g = map.get(l.key) ?? { key: l.key, name: l.name, colors: l.colors, items: [] };
      g.items.push(o);
      map.set(l.key, g);
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [filtered, grouped, laces]);

  function startBraiding(list: Order[], startId?: string, title?: string) {
    const open = list.filter((o) => OPEN_STATUSES.has(o.status)).sort(queueSort);
    if (!open.length) {
      toast('Ve vybrané frontě není nic k pletení.', 'info');
      return;
    }
    const start = Math.max(0, startId ? open.findIndex((o) => o.id === startId) : 0);
    setBraid({ ids: open.map((o) => o.id), start, title });
  }

  const laceFilterName = laceGroups.find((g) => g.key === laceFilter)?.name;

  return (
    <div className="space-y-6">
      {/* Přehled stavů */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'active' : s)}
            className={`card flex items-center justify-between px-5 py-4 text-left transition hover:border-white/20 ${statusFilter === s ? 'border-accent/60 shadow-glow' : ''}`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-muted">
                <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}
              </div>
              <div className="font-display text-3xl font-semibold">{counts[s]}</div>
            </div>
          </button>
        ))}
        <div className="card col-span-2 flex items-center justify-between px-5 py-4 lg:col-span-1">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-muted">Rozpracováno v Kč</div>
            <div className="font-display text-3xl font-semibold text-accent">{formatCzk(openValue)}</div>
          </div>
        </div>
      </section>

      {/* Ovládání */}
      <section className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={() => setForm({})}>
          <Plus size={18} /> Nová objednávka
        </button>
        <button
          className="btn-ghost border-accent/40 text-accent"
          onClick={() => startBraiding(filtered.length ? filtered : orders, undefined, laceFilterName ? `Série: ${laceFilterName}` : undefined)}
          title="Fullscreen režim pro pletení"
        >
          <Hand size={18} /> Režim u stolu
        </button>

        <div className="relative ml-auto w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input pl-9" placeholder="Hledat text, zákazníka, číslo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="active">Aktivní (bez odeslaných)</option>
          <option value="all">Všechny</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <button className={`btn-ghost ${grouped ? 'border-accent/50 text-accent' : ''}`} onClick={() => setGrouped((g) => !g)}>
          <Layers size={16} /> Seskupit podle barvy
        </button>
      </section>

      {/* Filtr sérií podle barvy tkaničky */}
      {laceGroups.length > 0 && (
        <section className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-muted">
            <Spool size={14} /> Série podle tkaničky:
          </span>
          <button className={`chip ${!laceFilter ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-ink-muted hover:text-ink'}`} onClick={() => setLaceFilter(null)}>
            Všechny barvy
          </button>
          {laceGroups.map((g) => (
            <button
              key={g.key}
              className={`chip ${laceFilter === g.key ? 'border-accent bg-accent/15 text-ink' : 'border-white/10 text-ink-muted hover:text-ink'}`}
              onClick={() => setLaceFilter(laceFilter === g.key ? null : g.key)}
            >
              <LaceSwatch colors={g.colors} className="h-3.5 w-6" />
              {g.name.replace(/ \(.*\)$/, '')}
              <span className="rounded-full bg-white/10 px-1.5">{g.open}</span>
            </button>
          ))}
        </section>
      )}

      {/* Seznam */}
      {filtered.length === 0 ? (
        <Empty icon={<Spool size={40} />} title="Fronta je prázdná">
          Přidejte novou objednávku nebo změňte filtr. Data se ukládají automaticky v tomto počítači.
        </Empty>
      ) : (
        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.key} className="space-y-3">
              {grouped && (
                <div className="flex items-center gap-3">
                  <LaceSwatch colors={sec.colors} className="h-6 w-10" />
                  <h2 className="section-title">{sec.name}</h2>
                  <span className="text-sm text-ink-muted">{sec.items.length} ks</span>
                  {sec.items.some((o) => OPEN_STATUSES.has(o.status)) && (
                    <button className="btn-ghost ml-auto py-1.5 text-xs" onClick={() => startBraiding(sec.items, undefined, `Série: ${sec.name}`)}>
                      <Hand size={14} /> Plést sérii
                    </button>
                  )}
                </div>
              )}
              {sec.items.map((o) => (
                <OrderCard key={o.id} order={o} onEdit={() => setForm({ order: o })} onBraid={() => startBraiding(sec.items, o.id)} />
              ))}
            </section>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.order ? `Upravit ${form.order.number}` : 'Nová objednávka'} wide>
        {form && <OrderForm order={form.order} onDone={() => setForm(null)} />}
      </Modal>

      {braid && <BraidingMode ids={braid.ids} startIndex={braid.start} title={braid.title} onClose={() => setBraid(null)} />}
    </div>
  );
}
