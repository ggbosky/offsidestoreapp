import { useMemo, useRef, useState } from 'react';
import { Copy, Download, Hash, Lightbulb, RefreshCw, Sparkles, Video } from 'lucide-react';
import { useData } from '../../store/data';
import { Field } from '../../components/ui';
import { LaceSwatch } from '../../components/BraceletGraphic';
import { BRAND } from '../../config';
import { normalizeText, priceForText } from '../../lib/pricing';
import { toast } from '../../store/toast';
import { FORMAT_LABEL, TONE_LABEL, generateIdeas, type SocialFormat, type SocialTone } from './generator';
import { PostPreview, downloadSvgAsPng } from './PostPreview';

const SLOVAK = new Set(['trencin', 'slovan']);

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Zkopírováno do schránky.');
}

export function SocialPage() {
  const { clubs, laces, endcaps, settings } = useData();
  const [target, setTarget] = useState<string>(clubs[0] ? `club:${clubs[0].id}` : `lace:${laces[0]?.id}`);
  const [text, setText] = useState('LVT 1945');
  const [format, setFormat] = useState<SocialFormat>('post');
  const [tone, setTone] = useState<SocialTone>('hype');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [endcapId, setEndcapId] = useState(endcaps[0]?.id ?? '');
  const svgRef = useRef<SVGSVGElement>(null);

  const club = target.startsWith('club:') ? clubs.find((c) => `club:${c.id}` === target) : undefined;
  const lace = laces.find((l) => (club ? l.id === club.laceId : `lace:${l.id}` === target));
  const colors = lace?.colors ?? ['#9BA3AF'];
  const colorText = lace?.name.match(/\((.*)\)/)?.[1] ?? lace?.name ?? '';
  const price = priceForText(text || 'ABC', settings.pricing);
  const title = club?.name ?? lace?.name.replace(/ \(.*\)$/, '') ?? 'Offsidestore';

  const ideas = useMemo(
    () =>
      generateIdeas(
        {
          club: club?.name ?? null,
          clubHashtag: club?.hashtag,
          slovak: club ? SLOVAK.has(club.id) : false,
          text,
          format,
          tone,
          price: settings.pricing.basePrice,
          web: BRAND.web,
          claim: BRAND.claim,
          seed,
        },
        colorText,
      ),
    [club, text, format, tone, seed, settings.pricing.basePrice, colorText],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            <h2 className="section-title">Podklady pro sítě</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Klub / barva">
              <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
                <optgroup label="Kluby">
                  {clubs.map((c) => (
                    <option key={c.id} value={`club:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Ostatní barvy">
                  {laces
                    .filter((l) => !clubs.some((c) => c.laceId === l.id))
                    .map((l) => (
                      <option key={l.id} value={`lace:${l.id}`}>
                        {l.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </Field>
            <Field label="Text / hláška na náramku">
              <input className="input font-display tracking-widest" value={text} maxLength={30} onChange={(e) => setText(normalizeText(e.target.value))} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_LABEL) as SocialFormat[]).map((f) => (
              <button key={f} onClick={() => setFormat(f)} className={`chip ${format === f ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-ink-muted hover:text-ink'}`}>
                {FORMAT_LABEL[f]}
              </button>
            ))}
            <span className="mx-1 w-px bg-white/10" />
            {(Object.keys(TONE_LABEL) as SocialTone[]).map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`chip ${tone === t ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-ink-muted hover:text-ink'}`}>
                {TONE_LABEL[t]}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setSeed((s) => s + 7919)}>
            <RefreshCw size={16} /> Vygenerovat jiné nápady
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="section-title text-base">Texty příspěvku</h3>
          {ideas.captions.map((c, i) => (
            <div key={`${seed}-${i}`} className="card group relative whitespace-pre-line p-5 pr-14 text-sm leading-relaxed">
              {c}
              <div className="mt-3 text-xs text-accent/80">{ideas.hashtags}</div>
              <button className="btn-icon absolute right-3 top-3" title="Kopírovat text + hashtagy" onClick={() => copy(`${c}\n\n${ideas.hashtags}`)}>
                <Copy size={16} />
              </button>
            </div>
          ))}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Lightbulb size={16} className="text-warn" /> {format === 'post' ? 'Nápady na interakci' : 'Háčky / první vteřiny'}
            </h3>
            <ul className="space-y-2 text-sm text-ink-muted">
              {ideas.hooks.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">›</span>
                  <button className="text-left hover:text-ink" onClick={() => copy(h)} title="Kopírovat">
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Video size={16} className="text-accent" /> Co natočit / vyfotit
            </h3>
            <ul className="space-y-2 text-sm text-ink-muted">
              {ideas.visual.map((v, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">›</span>
                  {v}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card flex items-start gap-3 p-5">
          <Hash size={18} className="mt-0.5 shrink-0 text-accent" />
          <p className="flex-1 text-sm text-ink-muted">{ideas.hashtags}</p>
          <button className="btn-icon" onClick={() => copy(ideas.hashtags)} title="Kopírovat hashtagy">
            <Copy size={16} />
          </button>
        </section>
      </div>

      {/* Náhled vizuálu */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-3">
            <LaceSwatch colors={colors} className="h-5 w-8" />
            <span className="font-semibold">Náhled vizuálu</span>
            <span className="text-xs text-ink-faint">{format === 'post' ? '1080 × 1080' : '1080 × 1920'}</span>
            <select className="input ml-auto w-auto py-1.5 text-xs" value={endcapId} onChange={(e) => setEndcapId(e.target.value)} aria-label="Koncovky">
              {endcaps.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className={`mx-auto ${format === 'post' ? 'max-w-md' : 'max-w-[300px]'}`}>
            <PostPreview
              ref={svgRef}
              format={format}
              colors={colors}
              text={text || ' '}
              title={title}
              accent={settings.accent}
              price={Math.min(price, settings.pricing.basePrice)}
              finish={endcaps.find((e) => e.id === endcapId)?.finish}
            />
          </div>
          <button
            className="btn-ghost mt-4 w-full"
            onClick={() =>
              svgRef.current &&
              downloadSvgAsPng(svgRef.current, `offsidestore-${format}-${title.toLowerCase().replace(/\s+/g, '-')}.png`)
                .then(() => toast('Obrázek stažen.'))
                .catch((e: Error) => toast(e.message, 'error'))
            }
          >
            <Download size={16} /> Stáhnout PNG
          </button>
          <p className="mt-2 text-xs text-ink-faint">Náhled slouží jako podklad/šablona – pro finální post doporučuji reálnou fotku náramku.</p>
        </div>
      </aside>
    </div>
  );
}
