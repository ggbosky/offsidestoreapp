import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Columns3, ListChecks, Plus, Search, Users } from 'lucide-react';
import type { ContentItem, ContentPillar, ContentStage, Platform } from '../../types';
import { useData, newContent } from '../../store/data';
import { useUi } from '../../store/ui';
import { CONTENT_STAGES, PILLARS, PLATFORMS, STAGE_DOT } from '../../lib/meta';
import { addDays, formatShort, fromISO, monthName, relative, startOfWeek, toISODate, today } from '../../lib/dates';
import { LaceDot } from '../../components/BraceletGraphic';
import { PillarTag, PlatformTags } from './bits';

type View = 'board' | 'calendar';

export function ContentPage() {
  const content = useData((s) => s.content);
  const openContent = useUi((s) => s.openContent);
  const [view, setView] = useState<View>('board');
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [pillar, setPillar] = useState<ContentPillar | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase('cs');
    return content.filter(
      (c) =>
        (!platform || c.platforms.includes(platform)) &&
        (!pillar || c.pillar === pillar) &&
        (!n || [c.title, c.caption, c.hook, c.notes].join(' ').toLocaleLowerCase('cs').includes(n)),
    );
  }, [content, q, platform, pillar]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h-display mr-2 text-3xl">Plán obsahu</h1>
        <div className="inline-flex rounded-full border border-line-2 p-1">
          {(
            [
              ['board', 'Tabule', Columns3],
              ['calendar', 'Kalendář', CalendarDays],
            ] as const
          ).map(([v, l, Icon]) => (
            <button key={v} onClick={() => setView(v)} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${view === v ? 'bg-white text-bg' : 'text-muted hover:text-white'}`}>
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input rounded-full pl-9" placeholder="Hledat v obsahu…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => openContent(newContent())}>
          <Plus size={17} /> Nápad
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={`chip ${!platform ? 'chip-on' : 'chip-off'}`} onClick={() => setPlatform(null)}>
          Všechny sítě
        </button>
        {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
          <button key={p} className={`chip ${platform === p ? 'chip-on' : 'chip-off'}`} onClick={() => setPlatform(platform === p ? null : p)}>
            {PLATFORMS[p].label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line-2" />
        {(Object.keys(PILLARS) as ContentPillar[]).map((p) => (
          <button key={p} className={`chip ${pillar === p ? 'chip-on' : 'chip-off'}`} onClick={() => setPillar(pillar === p ? null : p)} title={PILLARS[p].hint}>
            <span className="h-2 w-2 rounded-full" style={{ background: PILLARS[p].color }} />
            {PILLARS[p].label}
          </button>
        ))}
      </div>

      {view === 'board' ? <Board items={filtered} /> : <MonthCalendar items={filtered} />}
    </div>
  );
}

// ───────────── Tabule (kanban) ─────────────

function Board({ items }: { items: ContentItem[] }) {
  const setStage = useData((s) => s.setContentStage);
  const openContent = useUi((s) => s.openContent);
  const [over, setOver] = useState<ContentStage | null>(null);

  return (
    <div className="grid gap-3 overflow-x-auto pb-2 [grid-template-columns:repeat(5,minmax(250px,1fr))]">
      {CONTENT_STAGES.map((st) => {
        const col = items
          .filter((c) => c.stage === st.id)
          .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || b.updatedAt.localeCompare(a.updatedAt));
        const shown = st.id === 'published' ? col.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 12) : col;
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
            className={`flex min-h-[420px] flex-col rounded-2xl border p-2.5 transition ${over === st.id ? 'border-brand bg-brand/[0.06]' : 'border-line bg-surface/60'}`}
          >
            <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${STAGE_DOT[st.id]}`} />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.1em]">{st.label}</h2>
              <span className="ml-auto rounded-full bg-white/[0.07] px-2 text-xs font-bold text-muted">{col.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-2">
              {shown.map((c) => (
                <ContentCard key={c.id} c={c} onOpen={() => openContent(c)} />
              ))}
              <button
                className="mt-auto rounded-xl border border-dashed border-line-2 py-2 text-xs font-bold text-faint hover:border-white/30 hover:text-white"
                onClick={() => openContent(newContent({ stage: st.id }))}
              >
                + Přidat
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ContentCard({ c, onOpen }: { c: ContentItem; onOpen: () => void }) {
  const bracelets = useData((s) => s.bracelets);
  const t = today();
  const late = c.date && c.date < t && c.stage !== 'published';
  const done = c.shots.filter((s) => s.done).length;
  const linked = bracelets.filter((b) => c.braceletIds.includes(b.id));
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      className="cursor-grab rounded-xl border border-line bg-surface-2 p-3 transition hover:border-white/25 active:cursor-grabbing"
      style={{ boxShadow: `inset 3px 0 0 ${PILLARS[c.pillar].color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold leading-snug">{c.title || <span className="text-faint">Bez názvu</span>}</h3>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PlatformTags platforms={c.platforms} />
        <PillarTag pillar={c.pillar} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        {c.date && (
          <span className={`font-bold ${late ? 'text-danger' : c.date === t ? 'text-brand' : 'text-muted'}`}>
            {formatShort(c.date)} · {relative(c.date, t)}
          </span>
        )}
        {c.shots.length > 0 && (
          <span className="flex items-center gap-1 text-muted">
            <ListChecks size={13} /> {done}/{c.shots.length}
          </span>
        )}
        {c.contactIds.length > 0 && (
          <span className="flex items-center gap-1 text-muted">
            <Users size={13} /> {c.contactIds.length}
          </span>
        )}
        {linked.length > 0 && (
          <span className="flex items-center gap-1">
            {linked.slice(0, 4).map((b) => (
              <LaceDot key={b.id} color={b.laceColor} className="h-3 w-3" />
            ))}
            <span className="font-bold text-muted">{linked.map((b) => b.letters).join(' · ').slice(0, 18)}</span>
          </span>
        )}
      </div>
    </article>
  );
}

// ───────────── Měsíční kalendář ─────────────

function MonthCalendar({ items }: { items: ContentItem[] }) {
  const keyDates = useData((s) => s.keyDates);
  const saveContent = useData((s) => s.saveContent);
  const openContent = useUi((s) => s.openContent);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const t = today();
  const first = toISODate(month);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const unscheduled = items.filter((c) => !c.date && c.stage !== 'published');

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <button className="btn-icon" onClick={() => shift(-1)} aria-label="Předchozí měsíc">
            <ChevronLeft />
          </button>
          <h2 className="section-title min-w-[180px] text-center capitalize">
            {monthName(month.getMonth())} {month.getFullYear()}
          </h2>
          <button className="btn-icon" onClick={() => shift(1)} aria-label="Další měsíc">
            <ChevronRight />
          </button>
          <button className="btn-ghost ml-2 py-1.5 text-xs" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Dnes
          </button>
          <span className="ml-auto text-xs text-faint">Přetáhni příspěvek na jiný den</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-faint">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d) => (
            <div key={d} className="pb-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const inMonth = fromISO(day).getMonth() === month.getMonth();
            const list = items.filter((c) => c.date === day);
            const occ = keyDates.filter((k) => k.date === day);
            return (
              <div
                key={day}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  const c = items.find((x) => x.id === id);
                  if (c) saveContent({ ...c, date: day, stage: c.stage === 'idea' ? 'prep' : c.stage });
                }}
                onDoubleClick={() => openContent(newContent({ date: day }))}
                className={`group min-h-[104px] rounded-lg border p-1.5 text-left ${day === t ? 'border-brand' : 'border-line'} ${inMonth ? 'bg-surface-2' : 'bg-transparent opacity-45'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${day === t ? 'rounded bg-brand px-1.5 text-white' : 'text-muted'}`}>{fromISO(day).getDate()}</span>
                  <button className="hidden rounded px-1 text-faint hover:text-white group-hover:block" onClick={() => openContent(newContent({ date: day }))} aria-label="Přidat">
                    <Plus size={13} />
                  </button>
                </div>
                {occ.map((k) => (
                  <div key={k.id} className="mt-1 truncate rounded bg-warn/15 px-1 text-[10px] font-bold text-warn" title={k.note}>
                    {k.title}
                  </div>
                ))}
                {list.map((c) => (
                  <button
                    key={c.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                    onClick={() => openContent(c)}
                    className={`mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold hover:brightness-125 ${c.stage === 'published' ? 'text-faint line-through' : 'text-white'}`}
                    style={{ background: `${PILLARS[c.pillar].color}2e`, borderLeft: `2px solid ${PILLARS[c.pillar].color}` }}
                    title={c.title}
                  >
                    {c.time && c.stage !== 'published' ? `${c.time} ` : ''}
                    {c.title || 'Bez názvu'}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="card p-4">
        <h3 className="mb-1 text-sm font-extrabold uppercase tracking-[0.1em]">Bez data</h3>
        <p className="mb-3 text-xs text-faint">Přetáhni nápad do kalendáře a naplánuj ho.</p>
        <div className="space-y-2">
          {unscheduled.map((c) => (
            <button
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
              onClick={() => openContent(c)}
              className="block w-full cursor-grab rounded-lg border border-line bg-surface-2 p-2 text-left text-sm font-semibold hover:border-white/25"
              style={{ boxShadow: `inset 3px 0 0 ${PILLARS[c.pillar].color}` }}
            >
              {c.title || 'Bez názvu'}
              <div className="mt-1">
                <PlatformTags platforms={c.platforms} />
              </div>
            </button>
          ))}
          {!unscheduled.length && <p className="text-sm text-muted">Všechno má datum. 👌</p>}
        </div>
      </aside>
    </div>
  );
}
