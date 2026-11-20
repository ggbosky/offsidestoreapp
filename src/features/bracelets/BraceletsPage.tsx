import { useState } from 'react';
import { CalendarPlus, Download, Plus } from 'lucide-react';
import { syncBraceletsFromProducts } from '../../lib/shopifySync';
import { toast } from '../../store/toast';
import type { BraceletStatus } from '../../types';
import { useData, newBracelet, newContent, getAppData } from '../../store/data';
import { useUi } from '../../store/ui';
import { BraceletGraphic, LaceDot } from '../../components/BraceletGraphic';
import { BRACELET_STATUS } from '../../lib/meta';
import { laceName } from '../../config';

export function BraceletsPage() {
  const { bracelets, clubs, content, shopify, replaceAll } = useData();
  const { openBracelet, openContent } = useUi();
  const [status, setStatus] = useState<BraceletStatus | null>(null);
  const list = bracelets.filter((b) => (status ? b.status === status : b.status !== 'archiv'));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h-display mr-2 text-3xl">Náramky</h1>
        <p className="text-sm text-muted">Knihovna designů a nápadů na nové kolekce – k propojení s obsahem.</p>
        {shopify && shopify.products.length > 0 && (
          <button
            className="btn-ghost ml-auto"
            title="Doplní fotky a stav z produktů v Shopify"
            onClick={() => {
              const r = syncBraceletsFromProducts(shopify.products, bracelets, clubs);
              replaceAll({ ...getAppData(), bracelets: r.bracelets });
              toast(`Ze Shopify: ${r.updated} aktualizováno, ${r.added} přidáno.`);
            }}
          >
            <Download size={16} /> Fotky ze Shopify
          </button>
        )}
        <button className={`btn-primary ${shopify && shopify.products.length > 0 ? '' : 'ml-auto'}`} onClick={() => openBracelet(newBracelet())}>
          <Plus size={17} /> Design / nápad
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={`chip ${!status ? 'chip-on' : 'chip-off'}`} onClick={() => setStatus(null)}>
          Aktivní
        </button>
        {(Object.keys(BRACELET_STATUS) as BraceletStatus[]).map((s) => (
          <button key={s} className={`chip ${status === s ? 'chip-on' : 'chip-off'}`} onClick={() => setStatus(status === s ? null : s)}>
            {BRACELET_STATUS[s].label} <span className="opacity-60">{bracelets.filter((b) => b.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {list.map((b) => {
          const club = clubs.find((c) => c.id === b.clubId);
          const used = content.filter((c) => c.braceletIds.includes(b.id));
          const lastPost = used.filter((c) => c.stage === 'published' && c.date).sort((a, z) => z.date!.localeCompare(a.date!))[0];
          return (
            <article key={b.id} className="card group overflow-hidden">
              <button onClick={() => openBracelet(b)} className="block w-full text-left">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#1D1D22,#050505_75%)]">
                  {b.photo ? (
                    <img src={b.photo} alt={b.name} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                  ) : (
                    <BraceletGraphic color={b.laceColor} text={b.letters} sideLength={50} className="w-[88%] -rotate-[8deg]" />
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${BRACELET_STATUS[b.status].cls} backdrop-blur`}>
                    {BRACELET_STATUS[b.status].label}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-lg font-extrabold">{b.name || b.letters}</h3>
                    <span className="shrink-0 text-xl font-extrabold tracking-[0.15em]">{b.letters}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <LaceDot color={b.laceColor} className="h-3.5 w-3.5" />
                    {laceName(b.laceColor)}
                    {club && <span>· {club.name}</span>}
                  </div>
                  <div className="mt-2 text-xs text-faint">
                    {used.length ? `V obsahu: ${used.length}×` : 'Zatím v žádném obsahu'}
                    {lastPost ? ` · naposledy ${lastPost.date!.split('-').reverse().slice(0, 2).join('. ')}.` : ''}
                  </div>
                </div>
              </button>
              <div className="border-t border-line px-4 py-2.5">
                <button className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-brand" onClick={() => openContent(newContent({ title: `${b.name || b.letters}`, braceletIds: [b.id], pillar: 'produkt' }))}>
                  <CalendarPlus size={14} /> Vytvořit obsah
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
