import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookmarkPlus, Copy, Download, ImagePlus, Images, LayoutTemplate, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useData, newContent } from '../../store/data';
import { useUi } from '../../store/ui';
import { Field } from '../../components/ui';
import { resizeImage } from '../../lib/image';
import { downloadBlob, svgToPngBlob } from '../../lib/svgExport';
import { uid } from '../../lib/id';
import { toast } from '../../store/toast';
import { askConfirm } from '../../store/confirm';
import { GRADE_LABEL, PRODUCT_ABBRS, STYLE_LABEL, TEMPLATES, newSlide, productPhoto, useCarousel, type Grade, type SlideStyle } from './model';
import { SlideSvg } from './SlideSvg';
import { photoPatch, withProductPhotos } from './photos';
import { LogoToggle } from '../../components/LogoToggle';

const FIELD_LABELS: Record<SlideStyle, [string, string, string]> = {
  titulek: ['Nadpis', 'Druhý řádek', 'Malý nadpis (klub, téma)'],
  srovnani: ['Horní popisek (jinde / tehdy)', 'Dolní popisek (u nás / teď)', 'Otázka nahoře'],
  promo: ['Název produktu', 'Doplněk pod cenou', 'Malý nadpis'],
  dokument: ['Titulek', 'Druhý řádek', 'Malý nadpis (místo, datum, kapitola)'],
  meme: ['Text nahoře', 'Text dole', ''],
  text: ['Text', 'Druhý řádek', 'Malý nadpis'],
};

export function CarouselPage() {
  const { clubs, bracelets } = useData();
  const openContent = useUi((s) => s.openContent);
  const { slides, active, settings: rawSettings, set, update, setActive, setSettings } = useCarousel();
  const showLogo = useData((s) => s.settings.showLogo);
  const settings = { ...rawSettings, showLogo };
  const [clubId, setClubId] = useState(clubs[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<1 | 2>(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportRefs = useRef<Array<SVGSVGElement | null>>([]);
  const club = clubs.find((c) => c.id === clubId);
  const slide = slides.find((s) => s.id === active) ?? slides[0];
  const idx = slide ? slides.indexOf(slide) : 0;

  async function applyTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id)!;
    if (slides.length && !(await askConfirm(`Nahradit rozpracovaný carousel šablonou „${t.name}“?`))) return;
    const built = t.build(club);
    const withPhotos = id === 'prazdny' ? built : await withProductPhotos(built, club?.abbr);
    set(withPhotos);
  }

  // první otevření: dokumentární šablona
  useEffect(() => {
    if (!slides.length && clubs.length) applyTemplate('srovnani-promo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[idx], next[j]] = [next[j], next[idx]];
    set(next, slide.id);
  };

  async function onFiles(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
    if (!list.length) return;
    if (slide?.style === 'srovnani' && target === 2) {
      update(slide.id, await photoPatch(await resizeImage(list[0], 2000, 0.9), 2));
      return;
    }
    const patches = await Promise.all(list.map(async (f) => photoPatch(await resizeImage(f, 2000, 0.9))));
    let next = [...slides];
    let first = true;
    for (const p of patches) {
      if (first && slide && !slide.photo && slide.style !== 'text') {
        next = next.map((s) => (s.id === slide.id ? { ...s, ...p } : s));
      } else if (first && slide) {
        next = next.map((s) => (s.id === slide.id ? { ...s, ...p, style: s.style === 'text' ? 'dokument' : s.style } : s));
      } else {
        next.push(newSlide({ ...p, kicker: slide?.kicker ?? '' }));
      }
      first = false;
    }
    set(next, slide?.id);
    if (patches.length > 1) toast(`Přidáno ${patches.length - 1} nových slidů s fotkami.`);
  }

  async function exportAll() {
    setBusy(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      for (let i = 0; i < slides.length; i++) {
        const el = exportRefs.current[i];
        if (!el) continue;
        downloadBlob(await svgToPngBlob(el), `offsidestore-${date}-slide-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 350));
      }
      toast(`Staženo ${slides.length} slidů do složky Stažené soubory.`);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function saveToPlan() {
    const first = slides[0];
    openContent(
      newContent({
        title: first?.text || 'Carousel',
        platforms: [settings.vertical ? 'ig-story' : 'ig-post'],
        pillar: 'zakulisi',
        hook: first?.text ?? '',
        shots: slides.map((s, i) => ({ id: uid('s'), text: `Slide ${i + 1} (${STYLE_LABEL[s.style]}): ${[s.kicker, s.text, s.text2].filter(Boolean).join(' · ')}`, done: false })),
        notes: 'Carousel z editoru Tvorba. Slidy stáhni jako PNG a nahraj v pořadí.',
      }),
    );
  }

  const libraryPhotos = [
    ...PRODUCT_ABBRS.map((a) => ({ key: a, src: productPhoto(a), label: a })),
    ...bracelets.filter((b) => b.photo && !b.photo.startsWith('http')).map((b) => ({ key: b.id, src: b.photo!, label: b.letters })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h-display mr-2 flex items-center gap-2 text-3xl">
          <Images className="text-brand" /> Tvorba příspěvku
        </h1>
        <span className="text-sm text-muted">Carousel s fotkami v dokumentárním stylu</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={saveToPlan} disabled={!slides.length}>
            <BookmarkPlus size={16} /> Do plánu
          </button>
          <button className="btn-primary" onClick={exportAll} disabled={busy || !slides.length}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Stáhnout {slides.length} {slides.length === 1 ? 'slide' : slides.length < 5 ? 'slidy' : 'slidů'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Náhled + pás slidů */}
        <section className="space-y-4">
          <div className="card flex items-center justify-center p-5">
            <div className={settings.vertical ? 'w-full max-w-[380px]' : 'w-full max-w-[520px]'}>
              {slide && <SlideSvg slide={slide} settings={settings} index={idx} total={slides.length} className="h-auto w-full rounded-xl shadow-card" />}
            </div>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`relative w-28 shrink-0 overflow-hidden rounded-lg ring-2 transition ${s.id === slide?.id ? 'ring-brand' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                aria-label={`Slide ${i + 1}`}
              >
                <SlideSvg slide={s} settings={{ ...settings, grain: false }} index={i} total={slides.length} className="h-auto w-full" />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[11px] font-bold">{i + 1}</span>
              </button>
            ))}
            <button
              className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-2 text-xs font-bold text-muted hover:border-white/40 hover:text-white"
              onClick={() => {
                const n = newSlide({ kicker: slide?.kicker ?? '', photo: slide?.photo ?? null, photoW: slide?.photoW ?? 0, photoH: slide?.photoH ?? 0 });
                set([...slides, n], n.id);
              }}
              disabled={slides.length >= 10}
            >
              <Plus size={18} /> Slide
            </button>
          </div>
          {slide && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => move(-1)} disabled={idx === 0}>
                <ArrowLeft size={14} /> Posunout
              </button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => move(1)} disabled={idx === slides.length - 1}>
                Posunout <ArrowRight size={14} />
              </button>
              <button
                className="btn-ghost px-3 py-1.5 text-xs"
                onClick={() => {
                  const c = { ...slide, id: uid('sl') };
                  const next = [...slides];
                  next.splice(idx + 1, 0, c);
                  set(next, c.id);
                }}
                disabled={slides.length >= 10}
              >
                <Copy size={14} /> Duplikovat
              </button>
              <button
                className="btn-ghost px-3 py-1.5 text-xs hover:text-danger"
                onClick={() => {
                  const next = slides.filter((s) => s.id !== slide.id);
                  set(next.length ? next : [newSlide()], next[Math.max(0, idx - 1)]?.id);
                }}
              >
                <Trash2 size={14} /> Smazat slide
              </button>
              <span className="ml-auto self-center text-xs text-faint">Max. 10 slidů (limit Instagramu)</span>
            </div>
          )}
        </section>

        {/* Úpravy */}
        <aside className="space-y-4">
          <section className="card space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.1em]">
              <LayoutTemplate size={16} className="text-brand" /> Šablona
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select className="input py-2" value={clubId} onChange={(e) => setClubId(e.target.value)} aria-label="Klub">
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t.id)} className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-left hover:border-white/30">
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-faint">{t.hint}</div>
                </button>
              ))}
            </div>
          </section>

          {slide && (
            <section className="card space-y-3 p-4">
              <div className="text-sm font-extrabold uppercase tracking-[0.1em]">Slide {idx + 1}</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STYLE_LABEL) as SlideStyle[]).map((st) => (
                  <button key={st} className={`chip ${slide.style === st ? 'chip-on' : 'chip-off'}`} onClick={() => update(slide.id, { style: st })}>
                    {STYLE_LABEL[st]}
                  </button>
                ))}
              </div>
              <Field label={FIELD_LABELS[slide.style][0]}>
                <textarea id="slide-text" className="input min-h-[64px]" value={slide.text} onChange={(e) => update(slide.id, { text: e.target.value })} />
              </Field>
              {slide.style === 'promo' && (
                <Field label="Cena">
                  <input id="slide-price" className="input text-lg font-extrabold text-brand" value={slide.price} onChange={(e) => update(slide.id, { price: e.target.value })} placeholder="290 Kč" />
                </Field>
              )}
              <Field label={FIELD_LABELS[slide.style][1]}>
                <textarea id="slide-text2" className="input min-h-[52px]" value={slide.text2} onChange={(e) => update(slide.id, { text2: e.target.value })} />
              </Field>
              {slide.style !== 'meme' && (
                <Field label={FIELD_LABELS[slide.style][2]}>
                  <input id="slide-kicker" className="input" value={slide.kicker} onChange={(e) => update(slide.id, { kicker: e.target.value })} placeholder="LITVÍNOV · LISTOPAD 2026" />
                </Field>
              )}

              {slide.style !== 'text' && (
                <div className="space-y-2 border-t border-line pt-3">
                  <div className="label">Fotka</div>
                  {slide.style === 'srovnani' && (
                    <div className="flex gap-1.5">
                      <button className={`chip ${target === 1 ? 'chip-on' : 'chip-off'}`} onClick={() => setTarget(1)}>
                        Horní fotka
                      </button>
                      <button className={`chip ${target === 2 ? 'chip-on' : 'chip-off'}`} onClick={() => setTarget(2)}>
                        Dolní fotka
                      </button>
                      {slide.photo2 && (
                        <button className="chip chip-off" onClick={() => update(slide.id, { photo2: null })}>
                          <X size={12} /> Dolní pryč
                        </button>
                      )}
                    </div>
                  )}
                  {slide.style === 'srovnani' && !slide.photo2 && <p className="text-xs text-faint">Bez dolní fotky se použije horní – nahoře černobíle, dole barevně.</p>}
                  <div className="flex gap-2">
                    <button className="btn-ghost flex-1 py-2 text-xs" onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={14} /> Nahrát fotky
                    </button>
                    {slide.photo && (
                      <button className="btn-ghost px-3 py-2" onClick={() => update(slide.id, { photo: null })} aria-label="Odebrat fotku">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-faint">Víc fotek najednou = víc slidů. Fotky náramků z e-shopu:</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {libraryPhotos.map((p) => (
                      <button key={p.key} className="relative aspect-[3/4] overflow-hidden rounded-md ring-1 ring-white/10 hover:ring-brand" onClick={async () => update(slide.id, await photoPatch(p.src, slide.style === 'srovnani' ? target : 1))} title={p.label}>
                        <img src={p.src} alt={p.label} className="h-full w-full object-cover" loading="lazy" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-bold">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  {slide.photo && (
                    <div className="grid gap-2 pt-1 text-xs text-muted">
                      <label className="grid grid-cols-[70px_1fr] items-center gap-2">
                        Přiblížení
                        <input type="range" min={1} max={2.5} step={0.01} value={slide.zoom} onChange={(e) => update(slide.id, { zoom: Number(e.target.value) })} className="accent-[#EC0016]" />
                      </label>
                      <label className="grid grid-cols-[70px_1fr] items-center gap-2">
                        Vodorovně
                        <input type="range" min={0} max={100} value={slide.focusX} onChange={(e) => update(slide.id, { focusX: Number(e.target.value) })} className="accent-[#EC0016]" />
                      </label>
                      <label className="grid grid-cols-[70px_1fr] items-center gap-2">
                        Svisle
                        <input type="range" min={0} max={100} value={slide.focusY} onChange={(e) => update(slide.id, { focusY: Number(e.target.value) })} className="accent-[#EC0016]" />
                      </label>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) onFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </section>
          )}

          <section className="card space-y-3 p-4">
            <div className="text-sm font-extrabold uppercase tracking-[0.1em]">Vzhled celého příspěvku</div>
            <div className="flex flex-wrap gap-1.5">
              <button className={`chip ${!settings.vertical ? 'chip-on' : 'chip-off'}`} onClick={() => setSettings({ vertical: false })}>
                Příspěvek 4:5
              </button>
              <button className={`chip ${settings.vertical ? 'chip-on' : 'chip-off'}`} onClick={() => setSettings({ vertical: true })}>
                Story / Reels 9:16
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(GRADE_LABEL) as Grade[]).map((g) => (
                <button key={g} className={`chip ${settings.grade === g ? 'chip-on' : 'chip-off'}`} onClick={() => setSettings({ grade: g })}>
                  {GRADE_LABEL[g]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 items-center gap-2 text-sm">
              <LogoToggle className="justify-self-start" />
              {(
                [
                  ['grain', 'Filmové zrno'],
                  ['showCounter', 'Číslo slidu'],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-muted">
                  <input type="checkbox" className="h-4 w-4 accent-[#EC0016]" checked={settings[k]} onChange={(e) => setSettings({ [k]: e.target.checked })} />
                  {l}
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* plné rozlišení pro export (skryté) */}
      <div className="pointer-events-none fixed -left-[99999px] top-0" aria-hidden>
        {slides.map((s, i) => (
          <SlideSvg
            key={s.id}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            slide={s}
            settings={settings}
            index={i}
            total={slides.length}
          />
        ))}
      </div>
    </div>
  );
}
