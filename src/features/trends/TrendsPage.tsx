import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronDown, Copy, Eye, Flame, ImagePlus, Loader2, RefreshCw, Search, ShieldAlert, Sparkles, Trash2, TrendingUp, X } from 'lucide-react';
import type { TrendIdea, TrendRisk } from '../../lib/integrations';
import { useData } from '../../store/data';
import { useUi } from '../../store/ui';
import { useIntegrations } from '../../store/integrations';
import { copyText } from '../../lib/clipboard';
import { risingClubs } from '../../lib/shopifyStats';
import { toast } from '../../store/toast';
import { runTrendSearch, useTrendSearch } from './runSearch';
import { ideaToContent, isExpired } from './ideaToContent';
import { ImageStudio } from './ImageStudio';
import { IntegrationPills } from './IntegrationPills';

const PRESETS = [
  'Meme formáty, které teď frčí',
  'Hokej tento týden (extraliga, NHL, reprezentace)',
  'Popkultura: hry, filmy, seriály, virály',
  'Black Friday a Vánoce',
  'Co dělají ostatní české značky (Jablkoňovna & spol.)',
];

const RISK: Record<TrendRisk, { label: string; cls: string }> = {
  nizke: { label: 'Bezpečné', cls: 'bg-ok/15 text-ok' },
  stredni: { label: 'Opatrně', cls: 'bg-warn/15 text-warn' },
  vysoke: { label: 'Riskantní', cls: 'bg-danger/15 text-danger' },
};

const FORMAT_LABEL: Record<TrendIdea['format'], string> = { meme: 'Meme', carousel: 'Carousel', reel: 'Reel', story: 'Story', tiktok: 'TikTok', foto: 'Foto' };

type Filter = 'novy' | 'sledovat' | 'pouzito' | 'zahozeno';

export function TrendsPage() {
  const { trendIdeas, trendBrief, settings, shopify, bracelets, clubs, updateSettings, setTrendStatus, clearDismissedTrends, saveContent } = useData();
  const openContent = useUi((s) => s.openContent);
  const { status, serverError, google, googleError, loadStatus, loadGoogle } = useIntegrations();
  const { busy, startedAt, error } = useTrendSearch();
  const [focus, setFocus] = useState(settings.trendFocus);
  const [filter, setFilter] = useState<Filter>('novy');
  const [showBrief, setShowBrief] = useState(false);
  const [studio, setStudio] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    loadStatus();
    loadGoogle();
  }, [loadStatus, loadGoogle]);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [busy, startedAt]);

  const list = useMemo(() => trendIdeas.filter((i) => i.status === filter), [trendIdeas, filter]);
  const rising = shopify ? risingClubs(shopify).slice(0, 3) : [];
  const canSearch = !!status?.anthropic.configured;

  function toPlan(i: TrendIdea) {
    const abbrs = new Set(i.clubs.map((c) => c.toUpperCase()));
    const ids = bracelets.filter((b) => abbrs.has(b.letters.toUpperCase()) || (b.clubId && abbrs.has(clubs.find((c) => c.id === b.clubId)?.abbr ?? ''))).map((b) => b.id);
    const item = ideaToContent(i, [...new Set(ids)].slice(0, 4));
    saveContent(item);
    setTrendStatus(i.id, 'pouzito');
    toast('Nápad je v plánu obsahu na dnešek.');
    openContent(item);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h-display mr-2 flex items-center gap-2 text-3xl">
          <Flame className="text-brand" /> Radar trendů
        </h1>
        <IntegrationPills />
        <label className="ml-auto flex items-center gap-2 text-sm text-muted" title="Při otevření aplikace jednou denně najde nové trendy (stojí kredit Claude API)">
          <input type="checkbox" className="h-4 w-4 accent-[#EC0016]" checked={settings.autoTrends === 'daily'} onChange={(e) => updateSettings({ autoTrends: e.target.checked ? 'daily' : 'off' })} />
          Hlídat automaticky (1× denně)
        </label>
      </div>

      {serverError && (
        <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
          <b>Lokální server neběží.</b> Trendy, Shopify a Gemini fungují jen v aplikaci spuštěné na tvém PC příkazem <code className="rounded bg-black/30 px-1">npm run dev</code> s vyplněným souborem <code className="rounded bg-black/30 px-1">.env</code> (návod v Nastavení → Propojení).
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        {/* Levý sloupec: živé signály */}
        <aside className="space-y-5">
          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={17} className="text-brand" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.1em]">Google Trends · Česko</h2>
              <button className="btn-icon ml-auto p-1" onClick={() => loadGoogle(true)} aria-label="Obnovit">
                <RefreshCw size={14} />
              </button>
            </div>
            {googleError && <p className="text-sm text-faint">{googleError}</p>}
            <ol className="space-y-1">
              {google.slice(0, 15).map((g, i) => (
                <li key={g.title}>
                  <button
                    className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/[0.05]"
                    onClick={() => setFocus((f) => (f ? `${f}, ${g.title}` : g.title))}
                    title="Přidat do zaměření"
                  >
                    <span className="w-5 text-right text-xs font-bold text-faint">{i + 1}.</span>
                    <span className="flex-1 truncate font-semibold">{g.title}</span>
                    <span className="text-xs text-faint group-hover:hidden">{g.traffic}</span>
                    <span className="hidden text-xs font-bold text-brand group-hover:inline">+ zaměřit</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {rising.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-2 text-sm font-extrabold uppercase tracking-[0.1em]">Ze Shopify roste</h2>
              {rising.map((c) => (
                <button key={c.abbr} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]" onClick={() => setFocus((f) => (f ? `${f}, fanoušci ${c.label}` : `fanoušci ${c.label}`))}>
                  <span className="font-bold">{c.label}</span>
                  <span className="font-bold text-ok">+{c.growth} %</span>
                </button>
              ))}
            </section>
          )}
        </aside>

        <div className="space-y-5">
          {/* Hledání */}
          <section className="card space-y-3 p-5">
            <label className="label" htmlFor="trend-focus">
              Na co se zaměřit (nepovinné)
            </label>
            <textarea
              id="trend-focus"
              className="input min-h-[70px]"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Třeba: derby Sparta–Slavia o víkendu, nový trend „2013 vs 2026“, Black Friday…"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} className="chip chip-off" onClick={() => setFocus(p)}>
                  {p}
                </button>
              ))}
              {focus && (
                <button className="chip chip-off" onClick={() => setFocus('')}>
                  <X size={12} /> Vyčistit
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                className="btn-primary py-3"
                disabled={busy || !canSearch}
                onClick={() => {
                  updateSettings({ trendFocus: focus });
                  runTrendSearch(focus);
                }}
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {busy ? `Hledám, co frčí… ${elapsed}s` : 'Najít trendy a vymyslet kraviny'}
              </button>
              <span className="text-xs text-faint">
                {canSearch
                  ? 'Claude prohledá web (CZ/SK + svět, hokej, popkultura) a vymyslí 6–8 příspěvků. Trvá 1–3 minuty, stojí řádově jednotky až nízké desítky Kč.'
                  : 'Pro hledání doplň ANTHROPIC_API_KEY do .env a spusť aplikaci přes npm run dev.'}
              </span>
            </div>
            {error && !busy && <p className="text-sm text-danger">{error}</p>}
          </section>

          {/* Přehled */}
          {trendBrief && (
            <section className="card">
              <button className="flex w-full items-center gap-2 px-5 py-4 text-left" onClick={() => setShowBrief((v) => !v)}>
                <Search size={16} className="text-brand" />
                <span className="font-extrabold uppercase tracking-[0.08em]">Co se teď děje</span>
                <span className="text-xs text-faint">
                  {new Date(trendBrief.at).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} · {trendBrief.sources.length} zdrojů
                </span>
                <ChevronDown size={16} className={`ml-auto transition ${showBrief ? 'rotate-180' : ''}`} />
              </button>
              {showBrief && (
                <div className="border-t border-line px-5 py-4">
                  <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted">{trendBrief.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trendBrief.sources.slice(0, 20).map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="chip chip-off max-w-[260px] truncate">
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Nápady */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['novy', 'Nové'],
                ['sledovat', 'Sledované'],
                ['pouzito', 'V plánu'],
                ['zahozeno', 'Zahozené'],
              ] as const
            ).map(([f, l]) => (
              <button key={f} className={`chip ${filter === f ? 'chip-on' : 'chip-off'}`} onClick={() => setFilter(f)}>
                {l} <span className="opacity-60">{trendIdeas.filter((i) => i.status === f).length}</span>
              </button>
            ))}
            {filter === 'zahozeno' && list.length > 0 && (
              <button className="chip chip-off ml-auto" onClick={clearDismissedTrends}>
                <Trash2 size={12} /> Vysypat
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-2 p-8 text-center text-muted">
              {filter === 'novy' ? 'Zatím žádné nové nápady. Klikni na „Najít trendy a vymyslet kraviny“.' : 'Tady zatím nic není.'}
            </div>
          ) : (
            <div className="grid gap-4 2xl:grid-cols-2">
              {list.map((i) => (
                <IdeaCard key={i.id} i={i} onPlan={() => toPlan(i)} onStudio={() => setStudio(i.imagePrompt)} onStatus={(s) => setTrendStatus(i.id, s)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {studio !== null && <ImageStudio open onClose={() => setStudio(null)} initialPrompt={studio} />}
    </div>
  );
}

function IdeaCard({ i, onPlan, onStudio, onStatus }: { i: TrendIdea; onPlan: () => void; onStudio: () => void; onStatus: (s: TrendIdea['status']) => void }) {
  const expired = isExpired(i);
  const left = Math.ceil((Date.parse(i.createdAt) + i.shelfLifeDays * 86_400_000 - Date.now()) / 86_400_000);
  return (
    <article className={`card flex flex-col p-5 ${expired ? 'opacity-55' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-white">{FORMAT_LABEL[i.format]}</span>
        <span className={`rounded-full px-2.5 py-0.5 ${RISK[i.risk].cls}`}>{RISK[i.risk].label}</span>
        <span className={expired ? 'text-faint' : left <= 1 ? 'text-danger' : 'text-warn'}>{expired ? 'Prošlé' : left <= 1 ? 'Dnes nebo nikdy' : `Vydrží ~${left} dny`}</span>
        {i.clubs.map((c) => (
          <span key={c} className="rounded bg-white/[0.08] px-1.5 py-0.5 text-white">
            {c}
          </span>
        ))}
      </div>
      <h3 className="mt-3 text-xl font-extrabold leading-tight">{i.trend}</h3>
      <p className="mt-1 text-sm text-muted">{i.whyNow}</p>

      <div className="mt-4 rounded-xl border border-line bg-bg/60 p-3.5">
        <div className="label">Koncept</div>
        <p className="text-[15px] leading-relaxed">{i.concept}</p>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-lg font-extrabold">„{i.hook}“</p>
        <div className="group relative rounded-xl bg-surface-2 p-3 pr-10 text-sm leading-relaxed">
          <p className="whitespace-pre-line">{i.caption}</p>
          <p className="mt-2 text-sky">{i.hashtags}</p>
          <button className="btn-icon absolute right-1.5 top-1.5 p-1.5" onClick={() => copyText(`${i.caption}\n\n${i.hashtags}`)} aria-label="Kopírovat popisek">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {i.imagePrompt && (
        <div className="mt-3 rounded-xl border border-dashed border-line-2 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="label mb-0">Prompt pro úpravu fotky (Gemini)</span>
            <button className="btn-icon ml-auto p-1" onClick={() => copyText(i.imagePrompt)} aria-label="Kopírovat prompt">
              <Copy size={13} />
            </button>
          </div>
          <p className="font-mono text-xs leading-relaxed text-muted">{i.imagePrompt}</p>
        </div>
      )}

      {i.risk !== 'nizke' && i.riskNote && (
        <p className="mt-3 flex items-start gap-2 text-xs text-warn">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {i.riskNote}
        </p>
      )}
      {i.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {i.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="max-w-[240px] truncate text-xs text-sky underline-offset-2 hover:underline">
              {s.title}
            </a>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button className="btn-primary px-4 py-2" onClick={onPlan}>
          <CalendarPlus size={15} /> Do plánu
        </button>
        {i.imagePrompt && (
          <button className="btn-ghost px-4 py-2" onClick={onStudio}>
            <ImagePlus size={15} /> Upravit fotku
          </button>
        )}
        {i.status !== 'sledovat' && (
          <button className="btn-ghost px-3 py-2" onClick={() => onStatus('sledovat')} title="Sledovat">
            <Eye size={15} />
          </button>
        )}
        {i.status !== 'zahozeno' ? (
          <button className="btn-ghost px-3 py-2" onClick={() => onStatus('zahozeno')} title="Zahodit">
            <X size={15} />
          </button>
        ) : (
          <button className="btn-ghost px-3 py-2 text-xs" onClick={() => onStatus('novy')}>
            Vrátit
          </button>
        )}
      </div>
    </article>
  );
}
