import { askConfirm } from '../../store/confirm';
import { ChevronRight, Hand, Pencil, StickyNote, Trash2 } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { useData } from '../../store/data';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { formatCzk, countChars } from '../../lib/pricing';
import { CHANNELS, NEXT_STATUS, STATUS_META, STATUS_ORDER, clubName, formatDate, resolveLace } from '../../lib/orders';
import { changeStatus } from './actions';

export function OrderCard({ order, onEdit, onBraid }: { order: Order; onEdit: () => void; onBraid: () => void }) {
  const laces = useData((s) => s.laces);
  const clubs = useData((s) => s.clubs);
  const endcaps = useData((s) => s.endcaps);
  const deleteOrder = useData((s) => s.deleteOrder);
  const lace = resolveLace(order, { laces });
  const club = clubName(order, { clubs });
  const endcap = endcaps.find((e) => e.id === order.endcapId);
  const meta = STATUS_META[order.status];
  const next = NEXT_STATUS[order.status];
  const open = order.status === 'new' || order.status === 'braiding';

  return (
    <article className={`card group relative overflow-hidden ${order.status === 'shipped' ? 'opacity-60' : ''}`}>
      {/* Barevný pruh tkaničky vlevo */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundImage: `repeating-linear-gradient(160deg, ${lace.colors.map((c, i) => `${c} ${i * 8}px ${(i + 1) * 8}px`).join(',')})` }}
      />
      <div className="grid items-center gap-4 py-4 pl-6 pr-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <span className="font-mono text-ink-muted">{order.number}</span>
            <span>·</span>
            <span>{formatDate(order.createdAt)}</span>
            <span>·</span>
            <span>{CHANNELS[order.channel]}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h3 className="truncate font-display text-3xl font-bold tracking-[0.18em] text-ink">{order.text}</h3>
            <span className="shrink-0 text-xs text-ink-faint">{countChars(order.text)} zn.</span>
          </div>
          <div className="mt-1 truncate text-sm text-ink-muted">
            <span className="font-semibold text-ink">{club ?? lace.name}</span>
            {club && <span> · {lace.name}</span>}
            {endcap && <span> · koncovky {endcap.name.toLowerCase()}</span>}
          </div>
          <div className="mt-0.5 truncate text-sm text-ink-muted">{order.customer || <span className="italic text-ink-faint">bez jména</span>}</div>
          {order.note && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-warn/10 px-2.5 py-1.5 text-xs text-warn">
              <StickyNote size={13} className="mt-0.5 shrink-0" />
              <span>{order.note}</span>
            </div>
          )}
        </div>

        <div className="hidden min-w-0 md:block">
          <BraceletGraphic colors={lace.colors} text={order.text} finish={endcap?.finish} sideLength={40} className="max-h-16 w-full" />
        </div>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <div className="text-right">
              <div className="font-display text-xl font-semibold">{formatCzk(order.price)}</div>
              {order.price !== order.listPrice && <div className="text-xs text-ink-faint line-through">{formatCzk(order.listPrice)}</div>}
            </div>
            <select
              value={order.status}
              onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold focus:outline-none ${meta.cls}`}
              aria-label="Stav objednávky"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="bg-ice-900 text-ink">
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-1">
            {open && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={onBraid} title="Otevřít v režimu u stolu">
                <Hand size={14} /> Plést
              </button>
            )}
            {next && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => changeStatus(order.id, next.status)}>
                {next.label} <ChevronRight size={14} />
              </button>
            )}
            <button className="btn-icon" onClick={onEdit} title="Upravit">
              <Pencil size={15} />
            </button>
            <button
              className="btn-icon hover:text-danger"
              title="Smazat"
              onClick={async () => {
                if (await askConfirm(`Opravdu smazat objednávku ${order.number} (${order.text})?`)) deleteOrder(order.id);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
