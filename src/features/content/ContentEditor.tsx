import { useEffect, useState } from 'react';
import { Copy, CopyPlus, ExternalLink, Plus, Trash2, Wand2, X } from 'lucide-react';
import type { ContentItem, ContentPillar, Platform } from '../../types';
import { useData } from '../../store/data';
import { useUi } from '../../store/ui';
import { Field, Modal } from '../../components/ui';
import { BraceletGraphic, LaceDot } from '../../components/BraceletGraphic';
import { CONTENT_STAGES, PILLARS, PLATFORMS } from '../../lib/meta';
import { uid } from '../../lib/id';
import { BRAND, laceName } from '../../config';
import { SLOVAK_CLUBS } from '../../data/seed';
import { generateIdeas, type SocialTone } from '../generator/generator';
import { askConfirm } from '../../store/confirm';
import { toast } from '../../store/toast';
import { copyText } from '../../lib/clipboard';

const TONE_FOR: Record<ContentPillar, SocialTone> = {
  produkt: 'product',
  vyroba: 'behind',
  zakulisi: 'behind',
  fanousci: 'fan',
  zapas: 'hype',
  spoluprace: 'fan',
  soutez: 'fan',
};

export function ContentEditor() {
  const item = useUi((s) => s.content);
  const open = useUi((s) => s.openContent);
  const exists = useData((s) => (item ? s.content.some((c) => c.id === item.id) : false));
  return (
    <Modal open={!!item} onClose={() => open(null)} title={exists ? 'Upravit obsah' : 'Nový obsah'} wide>
      {item && <EditorBody key={item.id} initial={item} exists={exists} onClose={() => open(null)} />}
    </Modal>
  );
}

function EditorBody({ initial, exists, onClose }: { initial: ContentItem; exists: boolean; onClose: () => void }) {
  const { bracelets, contacts, clubs, settings, saveContent, deleteContent } = useData();
  const openContent = useUi((s) => s.openContent);
  const [c, setC] = useState<ContentItem>(initial);
  const [shot, setShot] = useState('');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const set = (patch: Partial<ContentItem>) => setC((x) => ({ ...x, ...patch }));

  function save(close = true) {
    const title = c.title.trim() || c.hook.trim() || 'Nápad bez názvu';
    saveContent({ ...c, title });
    toast(exists ? 'Uloženo.' : 'Přidáno do plánu.');
    if (close) onClose();
  }

  // Ctrl/Cmd+S = uložit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const linked = bracelets.filter((b) => c.braceletIds.includes(b.id));
  const mainBracelet = linked[0];
  const club = mainBracelet?.clubId ? clubs.find((k) => k.id === mainBracelet.clubId) : undefined;

  function suggest() {
    const ideas = generateIdeas({
      club: club?.short ?? null,
      clubHashtag: club?.hashtag,
      slovak: club ? SLOVAK_CLUBS.has(club.id) : false,
      text: mainBracelet?.letters ?? club?.abbr ?? 'OFFSIDE',
      laceName: mainBracelet ? laceName(mainBracelet.laceColor) : 'klubová',
      platform: c.platforms[0] ?? 'ig-post',
      tone: TONE_FOR[c.pillar],
      price: settings.basePrice,
      web: BRAND.web,
      claim: BRAND.claim,
      seed,
    });
    setSeed((s) => s + 7919);
    set({
      hook: c.hook || ideas.hooks[0],
      caption: ideas.captions[0],
      hashtags: ideas.hashtags,
      shots: c.shots.length ? c.shots : ideas.visual.map((v) => ({ id: uid('s'), text: v, done: false })),
    });
  }

  const togglePlatform = (p: Platform) =>
    set({ platforms: c.platforms.includes(p) ? c.platforms.filter((x) => x !== p) : [...c.platforms, p] });
  const toggle = (key: 'braceletIds' | 'contactIds', id: string) =>
    set({ [key]: c[key].includes(id) ? c[key].filter((x) => x !== id) : [...c[key], id] } as Partial<ContentItem>);

  const capLen = c.caption.length + (c.hashtags ? c.hashtags.length + 2 : 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-5">
        <input
          className="w-full border-0 border-b border-line-2 bg-transparent pb-2 text-2xl font-extrabold placeholder:text-faint focus:border-brand focus:outline-none"
          placeholder="Název – o čem to bude?"
          value={c.title}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus={!exists}
        />

        <div className="flex flex-wrap gap-1.5">
          {CONTENT_STAGES.map((s) => (
            <button key={s.id} type="button" onClick={() => set({ stage: s.id })} className={`chip ${c.stage === s.id ? 'chip-on' : 'chip-off'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <div className="label">Sítě</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                <button key={p} type="button" onClick={() => togglePlatform(p)} className={`chip ${c.platforms.includes(p) ? 'chip-on' : 'chip-off'}`}>
                  {PLATFORMS[p].label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Datum">
            <div className="flex items-center gap-1">
              <input type="date" className="input w-40" value={c.date ?? ''} onChange={(e) => set({ date: e.target.value || null })} />
              {c.date && (
                <button type="button" className="btn-icon" onClick={() => set({ date: null })} aria-label="Zrušit datum">
                  <X size={15} />
                </button>
              )}
            </div>
          </Field>
          <Field label="Čas">
            <input type="time" className="input w-28" value={c.time} onChange={(e) => set({ time: e.target.value })} />
          </Field>
        </div>

        <div>
          <div className="label">Pilíř obsahu</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PILLARS) as ContentPillar[]).map((p) => (
              <button key={p} type="button" onClick={() => set({ pillar: p })} className={`chip ${c.pillar === p ? 'chip-on' : 'chip-off'}`} title={PILLARS[p].hint}>
                <span className="h-2 w-2 rounded-full" style={{ background: PILLARS[p].color }} />
                {PILLARS[p].label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-bg/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-extrabold uppercase tracking-[0.1em]">Text</span>
            <button type="button" className="btn-ghost ml-auto px-3 py-1.5 text-xs" onClick={suggest} title="Doplní háček, popisek, hashtagy a co natočit podle náramku a pilíře">
              <Wand2 size={14} /> Navrhnout text
            </button>
          </div>
          <div className="space-y-3">
            <Field label="Háček / první věta">
              <input className="input" value={c.hook} onChange={(e) => set({ hook: e.target.value })} placeholder="Tohle bylo včera ještě v brusli…" />
            </Field>
            <Field label={`Popisek (${capLen}/2200)`}>
              <textarea className="input min-h-[120px] leading-relaxed" value={c.caption} onChange={(e) => set({ caption: e.target.value })} />
            </Field>
            <Field label="Hashtagy">
              <input className="input text-sm text-sky" value={c.hashtags} onChange={(e) => set({ hashtags: e.target.value })} placeholder="#offsidestore #hokej" />
            </Field>
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => copyText([c.caption, c.hashtags].filter(Boolean).join('\n\n'))} disabled={!c.caption}>
              <Copy size={13} /> Kopírovat popisek + hashtagy
            </button>
          </div>
        </div>

        <div>
          <div className="label">Co natočit / nafotit</div>
          <div className="space-y-1.5">
            {c.shots.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5">
                <input type="checkbox" checked={s.done} onChange={() => set({ shots: c.shots.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })} className="h-4 w-4 accent-[#EC0016]" />
                <span className={`flex-1 text-sm ${s.done ? 'text-faint line-through' : ''}`}>{s.text}</span>
                <button type="button" className="btn-icon p-1" onClick={() => set({ shots: c.shots.filter((x) => x.id !== s.id) })} aria-label="Odebrat">
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className="input py-2"
                placeholder="Detail písmen na zábradlí stadionu…"
                value={shot}
                onChange={(e) => setShot(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (shot.trim()) set({ shots: [...c.shots, { id: uid('s'), text: shot.trim(), done: false }] });
                    setShot('');
                  }
                }}
              />
              <button
                type="button"
                className="btn-ghost px-3"
                onClick={() => {
                  if (shot.trim()) set({ shots: [...c.shots, { id: uid('s'), text: shot.trim(), done: false }] });
                  setShot('');
                }}
                aria-label="Přidat záběr"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <Field label="Poznámky">
          <textarea className="input min-h-[64px]" value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Hudba, lokace, kdo pomůže s natáčením…" />
        </Field>

        {c.stage === 'published' && (
          <div className="grid gap-4 rounded-2xl border border-ok/30 bg-ok/[0.05] p-4 sm:grid-cols-2">
            <Field label="Odkaz na příspěvek">
              <div className="flex gap-1">
                <input className="input" value={c.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://instagram.com/p/…" />
                {c.link && (
                  <a className="btn-icon" href={c.link} target="_blank" rel="noreferrer" aria-label="Otevřít">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </Field>
            <Field label="Jak to dopadlo">
              <textarea className="input min-h-[44px]" value={c.result} onChange={(e) => set({ result: e.target.value })} placeholder="Co fungovalo, komentáře, co příště jinak…" />
            </Field>
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
        <div className="rounded-2xl border border-line bg-bg/60 p-4">
          <div className="label">Náramky v příspěvku</div>
          {mainBracelet && <BraceletGraphic color={mainBracelet.laceColor} text={mainBracelet.letters} sideLength={40} className="mb-3 w-full" />}
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
            {bracelets
              .filter((b) => b.status !== 'archiv' || c.braceletIds.includes(b.id))
              .map((b) => (
                <button key={b.id} type="button" onClick={() => toggle('braceletIds', b.id)} className={`chip ${c.braceletIds.includes(b.id) ? 'chip-on' : 'chip-off'}`}>
                  <LaceDot color={b.laceColor} className="h-3 w-3" /> {b.letters || b.name}
                </button>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-bg/60 p-4">
          <div className="label">Spolupráce / kontakty</div>
          {contacts.length === 0 ? (
            <p className="text-sm text-faint">Zatím žádné kontakty.</p>
          ) : (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {contacts.map((k) => (
                <button key={k.id} type="button" onClick={() => toggle('contactIds', k.id)} className={`chip ${c.contactIds.includes(k.id) ? 'chip-on' : 'chip-off'}`}>
                  {k.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn-primary py-3">
            Uložit <span className="kbd border-white/30 bg-white/10 text-white/80">Ctrl S</span>
          </button>
          {exists && (
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  saveContent(c);
                  openContent({ ...c, id: uid('c'), title: `${c.title} (kopie)`, stage: 'idea', date: null, link: '', result: '', createdAt: new Date().toISOString() });
                }}
              >
                <CopyPlus size={15} /> Duplikovat
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={async () => {
                  if (await askConfirm(`Smazat „${c.title || 'bez názvu'}“?`)) {
                    deleteContent(c.id);
                    onClose();
                  }
                }}
                aria-label="Smazat"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
