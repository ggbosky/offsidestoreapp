import { useState } from 'react';
import { ArrowUpRight, CalendarPlus, Loader2, RefreshCw, ShoppingBag, TrendingDown, TrendingUp } from 'lucide-react';
import { useData, newContent } from '../../store/data';
import { useUi } from '../../store/ui';
import { useIntegrations } from '../../store/integrations';
import { api } from '../../lib/api';
import { tipsFromShopify } from '../../lib/shopifySync';
import { LaceDot } from '../../components/BraceletGraphic';
import { toast } from '../../store/toast';

export async function refreshShopify(days = 30) {
  const { clubs, setShopify } = useData.getState();
  const s = await api.shopifySummary(clubs, days);
  setShopify(s);
  return s;
}

export function ShopifyPanel() {
  const { shopify: s, clubs } = useData();
  const openContent = useUi((st) => st.openContent);
  const status = useIntegrations((st) => st.status);
  const [busy, setBusy] = useState(false);
  const configured = !!status?.shopify.configured;

  async function load() {
    setBusy(true);
    try {
      await refreshShopify();
      toast('Data ze Shopify načtena.');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <div className="mb-4 flex items-center gap-2">
      <ShoppingBag size={18} className="text-brand" />
      <h2 className="section-title text-base">Ze Shopify{s ? ` · ${s.days} dní` : ''}</h2>
      {s && <span className="text-xs text-faint">načteno {new Date(s.fetchedAt).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
      {configured && (
        <button className="btn-ghost ml-auto px-3 py-1.5 text-xs" onClick={load} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {s ? 'Obnovit' : 'Načíst'}
        </button>
      )}
    </div>
  );

  if (!s) {
    return (
      <section className="card p-5">
        {head}
        <p className="text-sm text-muted">
          {configured
            ? 'Načti objednávky a uvidíš, které kluby rostou, nejčastější nápisy a nápady na příspěvky z dat.'
            : 'Shopify zatím není propojený. Návod je v Nastavení → Propojení (stačí doplnit údaje do souboru .env).'}
        </p>
      </section>
    );
  }

  const max = Math.max(1, ...s.byClub.map((c) => c.count));
  const tips = tipsFromShopify(s);

  return (
    <section className="card p-5">
      {head}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Num label="Náramků" value={s.bracelets} />
            <Num label="Objednávek" value={s.orders} />
            <Num label="Vlastní nápis" value={s.customBracelets} />
          </div>
          <div className="space-y-1.5">
            {s.byClub.slice(0, 8).map((c) => {
              const club = clubs.find((k) => k.id === c.clubId);
              const up = c.secondHalf > c.firstHalf;
              const down = c.secondHalf < c.firstHalf;
              return (
                <div key={c.label} className="grid grid-cols-[96px_1fr_34px_16px] items-center gap-2 text-sm">
                  <span className="flex items-center gap-1.5 truncate font-bold">
                    {club && <LaceDot color={club.laceColor} className="h-2.5 w-2.5" />}
                    {c.abbr !== '—' ? c.abbr : c.label}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(c.count / max) * 100}%` }} />
                  </div>
                  <span className="text-right font-bold tabular-nums">{c.count}</span>
                  {up ? <TrendingUp size={14} className="text-ok" /> : down ? <TrendingDown size={14} className="text-faint" /> : <span />}
                </div>
              );
            })}
          </div>
          {s.warnings.length > 0 && <p className="mt-3 text-xs text-faint">{s.warnings.join(' ')}</p>}
        </div>

        <div className="space-y-2">
          <div className="label">Nápady z dat</div>
          {tips.map((t) => (
            <div key={t.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex items-start gap-2">
                <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{t.title}</div>
                  <div className="text-sm text-muted">{t.text}</div>
                </div>
                {t.contentTitle && (
                  <button className="btn-icon" title="Vytvořit obsah" onClick={() => openContent(newContent({ title: t.contentTitle, notes: t.text, pillar: 'produkt' }))}>
                    <CalendarPlus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!tips.length && <p className="text-sm text-faint">Na tipy je zatím málo dat.</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-faint">Jen kusy a kluby pro plánování obsahu – tržby a účetnictví zůstávají v Shopify.</p>
    </section>
  );
}

function Num({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
