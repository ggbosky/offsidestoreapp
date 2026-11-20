import { useMemo } from 'react';
import { AlarmClock, ArrowRight, CalendarPlus, Check, Clock, Lightbulb, MessageCircle, Plus, Trophy, UserPlus } from 'lucide-react';
import { useData, newContact, newContent } from '../../store/data';
import { useUi } from '../../store/ui';
import { addDays, dowShort, formatShort, fromISO, relative, startOfWeek, today } from '../../lib/dates';
import { dueFollowUps, overdueContent, pillarMix, upcomingContent } from '../../lib/selectors';
import { CRM_STAGES, PILLARS, crmStage } from '../../lib/meta';
import { PillarTag, PlatformTags } from '../content/bits';
import { toast } from '../../store/toast';
import type { ContentPillar } from '../../types';
import { ShopifyPanel } from '../shopify/ShopifyPanel';
import { isExpired } from '../trends/ideaToContent';
import { Flame } from 'lucide-react';

export function DashboardPage() {
  const { content, contacts, keyDates, setContentStage, saveContact, trendIdeas } = useData();
  const hot = trendIdeas.filter((i) => i.status === 'novy' && !isExpired(i)).slice(0, 3);
  const { openContent, openContact, setTab } = useUi();
  const t = today();

  const overdue = useMemo(() => overdueContent(content, t), [content, t]);
  const upcoming = useMemo(() => upcomingContent(content, 7, t), [content, t]);
  const followUps = useMemo(() => dueFollowUps(contacts, 3, t), [contacts, t]);
  const occasions = useMemo(() => keyDates.filter((k) => k.date >= t && k.date <= addDays(t, 75)).slice(0, 5), [keyDates, t]);
  const mix = useMemo(() => pillarMix(content, 30, t), [content, t]);
  const mixTotal = Object.values(mix).reduce((a, b) => a + b, 0);
  const ideas = content.filter((c) => c.stage === 'idea').length;
  const todayCount = content.filter((c) => c.date === t && c.stage !== 'published').length;
  const weekStart = startOfWeek(t);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const d = fromISO(t);

  return (
    <div className="space-y-6">
      {/* Úvod */}
      <section className="brand-grad relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/[0.06]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
              {dowShort(t)} {d.getDate()}. {d.getMonth() + 1}. {d.getFullYear()}
            </div>
            <h1 className="h-display mt-2 text-4xl sm:text-5xl">Co dnes posunout</h1>
            <p className="mt-3 max-w-xl text-white/80">
              {todayCount ? `Dnes publikovat: ${todayCount}. ` : 'Dnes nic naplánovaného k publikaci. '}
              {followUps.length ? `Ozvat se: ${followUps.length}. ` : ''}
              {occasions[0] ? `${occasions[0].title} ${relative(occasions[0].date, t)}.` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn bg-white text-bg hover:bg-white/90" onClick={() => openContent(newContent())}>
              <Lightbulb size={16} /> Nový nápad
            </button>
            <button className="btn border border-white/40 text-white hover:bg-white/10" onClick={() => openContact(newContact())}>
              <UserPlus size={16} /> Nový kontakt
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Obsah */}
        <section className="card p-5">
          <Head icon={<Clock size={18} />} title="Na řadě v obsahu" action={() => setTab('content')} />
          <div className="space-y-2">
            {overdue.map((c) => (
              <Row key={c.id} danger onClick={() => openContent(c)}>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.title || 'Bez názvu'}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-danger">
                    <AlarmClock size={12} /> mělo vyjít {relative(c.date!, t)} <PlatformTags platforms={c.platforms} />
                  </div>
                </div>
              </Row>
            ))}
            {upcoming.map((c) => (
              <Row key={c.id} onClick={() => openContent(c)}>
                <DateBadge iso={c.date!} today={t} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.title || 'Bez názvu'}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <PlatformTags platforms={c.platforms} />
                    <PillarTag pillar={c.pillar} />
                  </div>
                </div>
                {c.date === t && (
                  <button
                    className="btn-icon text-ok"
                    title="Označit jako publikované"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContentStage(c.id, 'published');
                      toast('Publikováno. Nezapomeň zapsat, jak to dopadlo.');
                    }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </Row>
            ))}
            {!overdue.length && !upcoming.length && (
              <Empty text={`Na příštích 7 dní nic naplánováno. V zásobníku máš ${ideas} nápadů.`} cta="Otevřít plán" onClick={() => setTab('content')} />
            )}
          </div>
        </section>

        {/* Follow-upy */}
        <section className="card p-5">
          <Head icon={<MessageCircle size={18} />} title="Ozvat se" action={() => setTab('crm')} />
          <div className="space-y-2">
            {followUps.map((k) => {
              const late = k.nextDate! < t;
              return (
                <Row key={k.id} danger={late} onClick={() => openContact(k)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{k.name}</span>
                      <span className={`chip py-0 ${crmStage(k.stage).cls}`}>{crmStage(k.stage).label}</span>
                    </div>
                    <div className="mt-1 truncate text-sm text-muted">{k.nextAction || 'Bez dalšího kroku'}</div>
                    <div className={`mt-0.5 text-xs font-bold ${late ? 'text-danger' : k.nextDate === t ? 'text-warn' : 'text-faint'}`}>{relative(k.nextDate!, t)}</div>
                  </div>
                  <button
                    className="btn-ghost px-3 py-1 text-xs"
                    title="Posunout o 3 dny"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveContact({ ...k, nextDate: addDays(t, 3) });
                      toast(`${k.name}: připomenu za 3 dny.`, 'info');
                    }}
                  >
                    +3 dny
                  </button>
                </Row>
              );
            })}
            {!followUps.length && <Empty text="Nikomu se teď nemusíš ozývat. Co takhle oslovit nového tvůrce?" cta="Přidat kontakt" onClick={() => openContact(newContact())} />}
          </div>
        </section>

        {/* Příležitosti */}
        <section className="card p-5">
          <Head icon={<Trophy size={18} />} title="Blíží se" action={() => setTab('settings')} actionLabel="Upravit" />
          <div className="space-y-2">
            {occasions.map((k) => {
              const planned = content.some((c) => c.date && c.date <= k.date && c.date >= addDays(k.date, -10) && c.title.toLowerCase().includes(k.title.toLowerCase().split(' ')[0]));
              return (
                <div key={k.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <DateBadge iso={k.date} today={t} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{k.title}</div>
                    <div className="text-xs text-faint">{k.note || relative(k.date, t)}</div>
                  </div>
                  {planned ? (
                    <span className="text-xs font-bold text-ok">Naplánováno</span>
                  ) : (
                    <button
                      className="btn-ghost px-3 py-1 text-xs"
                      onClick={() => openContent(newContent({ title: k.title, date: addDays(k.date, -3), stage: 'idea', pillar: 'produkt' }))}
                    >
                      <CalendarPlus size={13} /> Obsah
                    </button>
                  )}
                </div>
              );
            })}
            {!occasions.length && <Empty text="Žádné příležitosti v příštích 75 dnech. Přidej derby, play-off nebo svátky v Nastavení." />}
          </div>
        </section>
      </div>

      {/* Horké trendy */}
      {hot.length > 0 && (
        <section className="card p-5">
          <Head icon={<Flame size={18} />} title="Horké trendy – teď nebo nikdy" action={() => setTab('trends')} actionLabel="Radar" />
          <div className="grid gap-3 lg:grid-cols-3">
            {hot.map((i) => (
              <button key={i.id} onClick={() => setTab('trends')} className="rounded-xl border border-line bg-surface-2 p-4 text-left transition hover:border-brand/60">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand">{i.format}</div>
                <div className="mt-1 font-extrabold leading-snug">{i.trend}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted">{i.concept}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <ShopifyPanel />

      {/* Týden */}
      <section className="card p-5">
        <Head icon={<CalendarPlus size={18} />} title="Tento týden" action={() => setTab('content')} actionLabel="Kalendář" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {week.map((day) => {
            const items = content.filter((c) => c.date === day);
            const occ = keyDates.filter((k) => k.date === day);
            return (
              <div key={day} className={`group min-h-[120px] rounded-xl border p-2.5 ${day === t ? 'border-brand bg-brand/[0.07]' : 'border-line bg-surface-2'}`}>
                <div className={`mb-2 text-xs font-extrabold uppercase tracking-wider ${day === t ? 'text-brand' : 'text-muted'}`}>{formatShort(day)}</div>
                {occ.map((k) => (
                  <div key={k.id} className="mb-1 truncate rounded bg-warn/15 px-1.5 py-0.5 text-[11px] font-bold text-warn">
                    {k.title}
                  </div>
                ))}
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openContent(c)}
                    className={`mb-1 block w-full truncate rounded-md border-l-2 bg-white/[0.04] px-1.5 py-1 text-left text-xs hover:bg-white/[0.09] ${c.stage === 'published' ? 'text-faint line-through' : ''}`}
                    style={{ borderColor: PILLARS[c.pillar].color }}
                  >
                    {c.title || 'Bez názvu'}
                  </button>
                ))}
                <button
                  className="mt-1 flex w-full items-center justify-center rounded-md py-1 text-faint opacity-0 transition hover:bg-white/5 hover:text-ink focus:opacity-100 group-hover:opacity-100"
                  onClick={() => openContent(newContent({ date: day, stage: 'idea' }))}
                  aria-label={`Přidat obsah na ${formatShort(day)}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mix obsahu */}
        <section className="card p-5">
          <Head icon={<Lightbulb size={18} />} title="Mix obsahu (±30 dní)" />
          {mixTotal === 0 ? (
            <Empty text="Zatím žádný obsah s datem. Mix ti ukáže, jestli nepostuješ pořád jen produkt." />
          ) : (
            <div className="space-y-2.5">
              {(Object.keys(PILLARS) as ContentPillar[]).map((p) => {
                const n = mix[p] ?? 0;
                return (
                  <div key={p} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
                    <span className="font-bold text-muted">{PILLARS[p].label}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${(n / mixTotal) * 100}%`, background: PILLARS[p].color }} />
                    </div>
                    <span className="text-right font-bold tabular-nums">{n}</span>
                  </div>
                );
              })}
              <p className="pt-1 text-xs text-faint">Tip: drž poměr cca 1 produktový příspěvek na 2 příběhové (výroba, fanoušci, zápas).</p>
            </div>
          )}
        </section>

        {/* Pipeline */}
        <section className="card p-5">
          <Head icon={<UserPlus size={18} />} title="Vztahy a spolupráce" action={() => setTab('crm')} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CRM_STAGES.filter((s) => s.id !== 'nezajem').map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{s.label}</div>
                <div className="mt-1 text-3xl font-extrabold tabular-nums">{contacts.filter((k) => k.stage === s.id).length}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">Počty kontaktů podle fáze. Žádné tržby – ty máš v Shopify.</p>
        </section>
      </div>
    </div>
  );
}

function Head({ icon, title, action, actionLabel = 'Vše' }: { icon: React.ReactNode; title: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      <h2 className="section-title text-base">{title}</h2>
      {action && (
        <button className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted hover:text-white" onClick={action}>
          {actionLabel} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function Row({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:border-white/25 ${danger ? 'border-danger/40 bg-danger/[0.07]' : 'border-line bg-surface-2'}`}
    >
      {children}
    </div>
  );
}

function DateBadge({ iso, today: t }: { iso: string; today: string }) {
  const d = fromISO(iso);
  const isToday = iso === t;
  return (
    <div className={`flex w-12 shrink-0 flex-col items-center rounded-lg py-1 ${isToday ? 'bg-brand text-white' : 'bg-white/[0.06]'}`}>
      <span className="text-[10px] font-bold uppercase">{dowShort(iso)}</span>
      <span className="text-lg font-extrabold leading-none">{d.getDate()}.</span>
      <span className="text-[10px] font-bold opacity-70">{d.getMonth() + 1}.</span>
    </div>
  );
}

function Empty({ text, cta, onClick }: { text: string; cta?: string; onClick?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line-2 p-4 text-sm text-muted">
      {text}
      {cta && onClick && (
        <button className="mt-2 block font-bold text-brand hover:underline" onClick={onClick}>
          {cta} →
        </button>
      )}
    </div>
  );
}
