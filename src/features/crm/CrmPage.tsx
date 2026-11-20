import { useMemo, useState } from 'react';
import { AlarmClock, Columns3, Download, List, Plus, Search } from 'lucide-react';
import { importRepeatCustomers } from '../../lib/shopifySync';
import { toast } from '../../store/toast';
import type { Contact, ContactKind, CrmStage } from '../../types';
import { useData, newContact } from '../../store/data';
import { useUi } from '../../store/ui';
import { CONTACT_KINDS, CRM_STAGES, crmStage, formatFollowers } from '../../lib/meta';
import { relative, today } from '../../lib/dates';
import { LaceDot } from '../../components/BraceletGraphic';

export function CrmPage() {
  const contacts = useData((s) => s.contacts);
  const clubs = useData((s) => s.clubs);
  const openContact = useUi((s) => s.openContact);
  const shopify = useData((s) => s.shopify);
  const saveContact = useData((s) => s.saveContact);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ContactKind | null>(null);
  const [club, setClub] = useState<string | null>(null);
  const [showLost, setShowLost] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase('cs');
    return contacts.filter(
      (c) =>
        (!kind || c.kind === kind) &&
        (!club || c.clubIds.includes(club)) &&
        (!n || [c.name, c.instagram, c.tiktok, c.email, c.notes, c.nextAction, c.tags.join(' ')].join(' ').toLocaleLowerCase('cs').includes(n)),
    );
  }, [contacts, q, kind, club]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h-display mr-2 text-3xl">Kontakty a spolupráce</h1>
        <div className="inline-flex rounded-full border border-line-2 p-1">
          {(
            [
              ['board', 'Fáze', Columns3],
              ['list', 'Seznam', List],
            ] as const
          ).map(([v, l, Icon]) => (
            <button key={v} onClick={() => setView(v)} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${view === v ? 'bg-white text-bg' : 'text-muted hover:text-white'}`}>
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input rounded-full pl-9" placeholder="Jméno, @účet, poznámka…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {shopify?.repeatCustomers && shopify.repeatCustomers.length > 0 && (
          <button
            className="btn-ghost"
            title="Stálí zákazníci (2+ objednávky) jako kandidáti na ambasadory"
            onClick={() => {
              const fresh = importRepeatCustomers(shopify.repeatCustomers!, contacts);
              fresh.forEach(saveContact);
              toast(fresh.length ? `Importováno ${fresh.length} stálých zákazníků do fáze „Tip“.` : 'Všichni stálí zákazníci už v kontaktech jsou.', 'info');
            }}
          >
            <Download size={16} /> Stálí zákazníci ze Shopify
          </button>
        )}
        <button className="btn-primary" onClick={() => openContact(newContact())}>
          <Plus size={17} /> Kontakt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={`chip ${!kind ? 'chip-on' : 'chip-off'}`} onClick={() => setKind(null)}>
          Všichni
        </button>
        {(Object.keys(CONTACT_KINDS) as ContactKind[]).map((k) => (
          <button key={k} className={`chip ${kind === k ? 'chip-on' : 'chip-off'}`} onClick={() => setKind(kind === k ? null : k)}>
            {CONTACT_KINDS[k]}
          </button>
        ))}
        <select className="input ml-auto w-auto rounded-full py-1.5 text-sm" value={club ?? ''} onChange={(e) => setClub(e.target.value || null)} aria-label="Filtr klubu">
          <option value="">Všechny kluby</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.short}
            </option>
          ))}
        </select>
      </div>

      {view === 'board' ? (
        <Pipeline items={filtered} showLost={showLost} onToggleLost={() => setShowLost((v) => !v)} />
      ) : (
        <ContactTable items={filtered} />
      )}
    </div>
  );
}

function Pipeline({ items, showLost, onToggleLost }: { items: Contact[]; showLost: boolean; onToggleLost: () => void }) {
  const setStage = useData((s) => s.setContactStage);
  const openContact = useUi((s) => s.openContact);
  const [over, setOver] = useState<CrmStage | null>(null);
  const stages = CRM_STAGES.filter((s) => showLost || s.id !== 'nezajem');
  return (
    <>
      <div className="grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(205px, 1fr))` }}>
        {stages.map((st) => {
          const col = items.filter((c) => c.stage === st.id).sort((a, b) => (a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999'));
          return (
            <section
              key={st.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(st.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/plain');
                if (id) setStage(id, st.id);
                setOver(null);
              }}
              className={`flex min-h-[380px] flex-col rounded-2xl border p-2.5 transition ${over === st.id ? 'border-brand bg-brand/[0.06]' : 'border-line bg-surface/60'}`}
            >
              <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
                <h2 className={`text-sm font-extrabold uppercase tracking-[0.1em] ${crmStage(st.id).cls.split(' ').find((c) => c.startsWith('text-'))}`}>{st.label}</h2>
                <span className="ml-auto rounded-full bg-white/[0.07] px-2 text-xs font-bold text-muted">{col.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {col.map((c) => (
                  <ContactCard key={c.id} c={c} onOpen={() => openContact(c)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <button className="text-xs font-bold text-faint hover:text-white" onClick={onToggleLost}>
        {showLost ? 'Skrýt sloupec „Nezájem“' : 'Zobrazit i „Nezájem“'}
      </button>
    </>
  );
}

function ContactCard({ c, onOpen }: { c: Contact; onOpen: () => void }) {
  const clubs = useData((s) => s.clubs);
  const t = today();
  const late = c.nextDate && c.nextDate < t;
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      className="cursor-grab rounded-xl border border-line bg-surface-2 p-3 transition hover:border-white/25"
    >
      <div className="font-bold leading-snug">{c.name || 'Bez jména'}</div>
      <div className="mt-0.5 text-xs text-muted">
        {CONTACT_KINDS[c.kind]}
        {c.followers ? ` · ${formatFollowers(c.followers)}` : ''}
      </div>
      {(c.instagram || c.tiktok) && <div className="mt-1 truncate text-xs text-sky">{c.instagram || c.tiktok}</div>}
      {c.clubIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.clubIds.map((id) => {
            const k = clubs.find((x) => x.id === id);
            return k ? (
              <span key={id} className="flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-extrabold">
                <LaceDot color={k.laceColor} className="h-2.5 w-2.5" /> {k.abbr}
              </span>
            ) : null;
          })}
        </div>
      )}
      {(c.nextAction || c.nextDate) && (
        <div className={`mt-2 rounded-lg px-2 py-1.5 text-xs ${late ? 'bg-danger/10 text-danger' : 'bg-white/[0.04] text-muted'}`}>
          {c.nextDate && (
            <span className="mr-1 inline-flex items-center gap-1 font-bold">
              <AlarmClock size={11} /> {relative(c.nextDate, t)}:
            </span>
          )}
          {c.nextAction}
        </div>
      )}
    </article>
  );
}

function ContactTable({ items }: { items: Contact[] }) {
  const clubs = useData((s) => s.clubs);
  const openContact = useUi((s) => s.openContact);
  const t = today();
  const sorted = [...items].sort((a, b) => (a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999'));
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
          <tr className="border-b border-line">
            <th className="px-4 py-3">Kontakt</th>
            <th className="px-4 py-3">Typ</th>
            <th className="px-4 py-3">Kluby</th>
            <th className="px-4 py-3">Fáze</th>
            <th className="px-4 py-3">Další krok</th>
            <th className="px-4 py-3 text-right">Sledující</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} onClick={() => openContact(c)} className="cursor-pointer border-b border-line/60 hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-sky">{c.instagram || c.tiktok || c.email}</div>
              </td>
              <td className="px-4 py-3 text-muted">{CONTACT_KINDS[c.kind]}</td>
              <td className="px-4 py-3 font-bold">{c.clubIds.map((id) => clubs.find((k) => k.id === id)?.abbr).filter(Boolean).join(', ')}</td>
              <td className="px-4 py-3">
                <span className={`chip ${crmStage(c.stage).cls}`}>{crmStage(c.stage).label}</span>
              </td>
              <td className="px-4 py-3">
                <div className="max-w-[260px] truncate">{c.nextAction}</div>
                {c.nextDate && <div className={`text-xs font-bold ${c.nextDate < t ? 'text-danger' : 'text-faint'}`}>{relative(c.nextDate, t)}</div>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted">{formatFollowers(c.followers)}</td>
            </tr>
          ))}
          {!sorted.length && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted">
                Žádné kontakty. Začni tvůrci a fankluby svých 12 klubů.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
