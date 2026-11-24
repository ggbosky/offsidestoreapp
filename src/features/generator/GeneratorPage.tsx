import { useMemo, useRef, useState } from 'react';
import { BookmarkPlus, Copy, Download, Hash, ImagePlus, Lightbulb, RefreshCw, Type, Video, X } from 'lucide-react';
import { LogoToggle } from '../../components/LogoToggle';
import { resizeImage } from '../../lib/image';
import type { Platform } from '../../types';
import { useData, newContent } from '../../store/data';
import { useUi } from '../../store/ui';
import { Field } from '../../components/ui';
import { LaceDot } from '../../components/BraceletGraphic';
import { BRAND, LACE_COLORS, laceName } from '../../config';
import { SLOVAK_CLUBS } from '../../data/seed';
import { normalizeText } from '../../lib/pricing';
import { PLATFORMS } from '../../lib/meta';
import { uid } from '../../lib/id';
import { copyText } from '../../lib/clipboard';
import { toast } from '../../store/toast';
import { TONE_LABEL, generateIdeas, type MemeIdea, type SocialTone } from './generator';
import { PostPreview, downloadSvgAsPng } from './PostPreview';

const TONE_PILLAR = { meme: 'fanousci', hype: 'zapas', fan: 'fanousci', product: 'produkt', behind: 'vyroba' } as const;

export function GeneratorPage() {
  const { clubs, settings } = useData();
  const openContent = useUi((s) => s.openContent);
  const [clubId, setClubId] = useState<string>(clubs[0]?.id ?? '');
  const club = clubs.find((c) => c.id === clubId);
  const [text, setText] = useState(club?.abbr ?? 'LIT');
  const [color, setColor] = useState(club?.laceColor ?? '#B01E28');
  const [platform, setPlatform] = useState<Platform>('ig-post');
  const [tone, setTone] = useState<SocialTone>('meme');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [meme, setMeme] = useState<{ top: string; bottom: string } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const ideas = useMemo(
    () =>
      generateIdeas({
        club: club?.short ?? null,
        clubHashtag: club?.hashtag,
        slovak: club ? SLOVAK_CLUBS.has(club.id) : false,
        text,
        laceName: laceName(color),
        platform,
        tone,
        price: settings.basePrice,
        web: BRAND.web,
        claim: BRAND.claim,
        seed,
      }),
    [club, text, color, platform, tone, seed, settings.basePrice],
  );

  function saveIdea(caption: string, m?: MemeIdea) {
    openContent(
      newContent({
        title: m ? `Meme: ${m.top}` : `${club?.short ?? text} – ${TONE_LABEL[tone].toLowerCase()}`,
        platforms: [platform],
        pillar: TONE_PILLAR[tone],
        hook: m ? m.top : ideas.hooks[0],
        caption,
        hashtags: ideas.hashtags,
        shots: m
          ? [
              { id: uid('s'), text: `Text na obrázku nahoře: ${m.top}`, done: false },
              { id: uid('s'), text: `Text na obrázku dole: ${m.bottom}`, done: false },
              { id: uid('s'), text: 'Fotka: náramek v situaci z memu (vlastní fotka, žádná cizí loga ani tváře)', done: false },
            ]
          : ideas.visual.map((v) => ({ id: uid('s'), text: v, done: false })),
      }),
    );
  }

  const memeActive = tone === 'meme' ? meme ?? (ideas.memes[0] ? { top: ideas.memes[0].top, bottom: ideas.memes[0].bottom } : null) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        <h1 className="h-display text-3xl">Generátor obsahu</h1>
        <section className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Klub">
              <select
                className="input"
                value={clubId}
                onChange={(e) => {
                  const c = clubs.find((x) => x.id === e.target.value);
                  setClubId(e.target.value);
                  if (c) {
                    setText(c.abbr);
                    setColor(c.laceColor);
                  }
                }}
              >
                <option value="">Bez klubu</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Písmena / nápis">
              <input className="input text-lg font-extrabold tracking-[0.2em]" value={text} maxLength={24} onChange={(e) => setText(normalizeText(e.target.value))} />
            </Field>
          </div>
          <div>
            <div className="label">Tkanička – {laceName(color)}</div>
            <div className="flex flex-wrap gap-2">
              {LACE_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.name}
                  onClick={() => setColor(c.hex)}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface ${color.toLowerCase() === c.hex.toLowerCase() ? 'ring-brand' : 'ring-white/15'}`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <button key={p} onClick={() => setPlatform(p)} className={`chip ${platform === p ? 'chip-on' : 'chip-off'}`}>
                {PLATFORMS[p].label}
              </button>
            ))}
            <span className="mx-1 w-px bg-line-2" />
            {(Object.keys(TONE_LABEL) as SocialTone[]).map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`chip ${tone === t ? 'chip-on' : 'chip-off'}`}>
                {TONE_LABEL[t]}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => {
              setSeed((s) => s + 7919);
              setMeme(null);
            }}>
            <RefreshCw size={15} /> Jiné varianty
          </button>
        </section>

        {tone === 'meme' && (
          <section className="space-y-3">
            {ideas.memes.map((m, i) => (
              <div key={`${seed}-m-${i}`} className={`card p-5 ${memeActive?.top === m.top ? 'border-brand/60' : ''}`}>
                <div className="rounded-xl bg-bg/70 p-4 text-center font-extrabold uppercase leading-tight">
                  <p className="text-lg">{m.top}</p>
                  <p className="my-1 text-xs text-faint">· · ·</p>
                  <p className="text-lg">{m.bottom}</p>
                </div>
                <p className="mt-3 leading-relaxed">{m.caption}</p>
                <p className="mt-1 text-sm text-sky">{ideas.hashtags}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setMeme({ top: m.top, bottom: m.bottom })}>
                    <Type size={13} /> Dát na obrázek
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => copyText(`${m.caption}\n\n${ideas.hashtags}`)}>
                    <Copy size={13} /> Kopírovat popisek
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => saveIdea(m.caption, m)}>
                    <BookmarkPlus size={13} /> Uložit do plánu
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className={`space-y-3 ${tone === 'meme' ? 'hidden' : ''}`}>
          {ideas.captions.map((c, i) => (
            <div key={`${seed}-${i}`} className="card p-5">
              <p className="whitespace-pre-line leading-relaxed">{c}</p>
              <p className="mt-3 text-sm text-sky">{ideas.hashtags}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => copyText(`${c}\n\n${ideas.hashtags}`)}>
                  <Copy size={13} /> Kopírovat
                </button>
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => saveIdea(c)}>
                  <BookmarkPlus size={13} /> Uložit do plánu
                </button>
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wider">
              <Lightbulb size={16} className="text-warn" /> {platform === 'ig-post' ? 'Interakce' : 'Háčky'}
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {ideas.hooks.map((h, i) => (
                <li key={i}>
                  <button className="text-left hover:text-white" onClick={() => copyText(h)}>
                    <span className="mr-1.5 text-brand">›</span>
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wider">
              <Video size={16} className="text-brand" /> Co natočit
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {ideas.visual.map((v, i) => (
                <li key={i}>
                  <span className="mr-1.5 text-brand">›</span>
                  {v}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <section className="card flex items-start gap-3 p-5">
          <Hash size={18} className="mt-0.5 shrink-0 text-brand" />
          <p className="flex-1 text-sm text-muted">{ideas.hashtags}</p>
          <button className="btn-icon" onClick={() => copyText(ideas.hashtags)} aria-label="Kopírovat hashtagy">
            <Copy size={16} />
          </button>
        </section>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <LaceDot color={color} />
            <span className="font-bold">Vizuál</span>
            <span className="text-xs text-faint">{platform === 'ig-post' ? '1080 × 1350 (4:5)' : '1080 × 1920 (9:16)'}</span>
            <LogoToggle className="ml-auto" />
          </div>
          {memeActive && (
            <div className="mb-4 space-y-2">
              <input id="meme-top" className="input py-2 font-bold" value={memeActive.top} onChange={(e) => setMeme({ ...memeActive, top: e.target.value })} placeholder="Text nahoře" aria-label="Text nahoře" />
              <input id="meme-bottom" className="input py-2 font-bold" value={memeActive.bottom} onChange={(e) => setMeme({ ...memeActive, bottom: e.target.value })} placeholder="Text dole" aria-label="Text dole" />
              <div className="flex gap-2">
                <button className="btn-ghost flex-1 py-2 text-xs" onClick={() => photoRef.current?.click()}>
                  <ImagePlus size={14} /> {photo ? 'Jiná fotka' : 'Vlastní fotka na pozadí'}
                </button>
                {photo && (
                  <button className="btn-ghost px-3 py-2" onClick={() => setPhoto(null)} aria-label="Odebrat fotku">
                    <X size={14} />
                  </button>
                )}
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) setPhoto(await resizeImage(f, 1600, 0.9));
                }}
              />
            </div>
          )}
          <div className={`mx-auto ${platform === 'ig-post' ? 'max-w-sm' : 'max-w-[290px]'}`}>
            <PostPreview
              ref={svgRef}
              vertical={platform !== 'ig-post'}
              color={color}
              text={text || ' '}
              title={club?.short ?? 'Tvůj klub'}
              subtitle={club?.name ?? 'Vlastní nápis'}
              meme={memeActive}
              photo={photo}
              showLogo={settings.showLogo}
            />
          </div>
          <button
            className="btn-ghost mt-4 w-full"
            onClick={() =>
              svgRef.current &&
              downloadSvgAsPng(svgRef.current, `offsidestore-${(club?.abbr ?? text).toLowerCase()}-${platform}.png`)
                .then(() => toast('Vizuál stažen.'))
                .catch((e: Error) => toast(e.message, 'error'))
            }
          >
            <Download size={15} /> Stáhnout PNG
          </button>
          <p className="mt-2 text-xs text-faint">
            {tone === 'meme'
              ? 'Tip: vlastní fotka náramku v situaci z memu (tribuna, pod rukávem, u stromečku) funguje líp než grafika.'
              : 'Šablona/podklad. Nejlíp fungují skutečné fotky – třeba na červeném zábradlí jako na webu.'}
          </p>
        </div>
      </aside>
    </div>
  );
}
