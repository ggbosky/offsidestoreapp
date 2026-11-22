import { useRef, useState } from 'react';
import { Copy, Download, ImagePlus, Loader2, RotateCcw, Wand2 } from 'lucide-react';
import { Modal } from '../../components/ui';
import { useData } from '../../store/data';
import { useIntegrations } from '../../store/integrations';
import { api } from '../../lib/api';
import { resizeImage } from '../../lib/image';
import { copyText } from '../../lib/clipboard';
import { toast } from '../../store/toast';

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const blob = await (await fetch(url)).blob();
  return resizeImage(new File([blob], 'foto', { type: blob.type }), 1280, 0.9);
}

/** Úprava vlastní fotky náramku přes Gemini (Nano Banana) – styl Jablkoňovny. */
export function ImageStudio({ open, onClose, initialPrompt }: { open: boolean; onClose: () => void; initialPrompt: string }) {
  const bracelets = useData((s) => s.bracelets);
  const gemini = useIntegrations((s) => s.status?.gemini);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [source, setSource] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const withPhotos = bracelets.filter((b) => b.photo);

  async function run() {
    if (!source) return toast('Nejdřív vyber fotku.', 'warn');
    setBusy(true);
    try {
      const out = await api.editImage(prompt, await urlToDataUrl(source));
      setResult(out.image);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Úprava fotky přes Gemini" wide>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="label">1. Fotka náramku</div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={15} /> Nahrát fotku
              </button>
              {withPhotos.slice(0, 8).map((b) => (
                <button key={b.id} onClick={() => setSource(b.photo!)} className={`h-11 w-11 overflow-hidden rounded-lg ring-2 ${source === b.photo ? 'ring-brand' : 'ring-transparent'}`} title={b.name}>
                  <img src={b.photo} alt={b.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) setSource(await resizeImage(f, 1280, 0.9));
              }}
            />
          </div>
          <div>
            <div className="label">2. Co udělat (anglicky funguje nejlíp)</div>
            <textarea id="gemini-prompt" className="input min-h-[150px] font-mono text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={run} disabled={busy || !gemini?.configured}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} {busy ? 'Gemini pracuje…' : 'Upravit fotku'}
            </button>
            <button className="btn-ghost" onClick={() => copyText(prompt)}>
              <Copy size={15} /> Kopírovat prompt
            </button>
          </div>
          {!gemini?.configured && (
            <p className="rounded-xl bg-warn/10 p-3 text-sm text-warn">
              Gemini není propojené (klíč vlož v Nastavení → Propojení). Prompt můžeš zkopírovat a vložit s fotkou do aplikace Gemini.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <figure className="space-y-1.5">
            <figcaption className="label">Původní</figcaption>
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-line bg-bg">
              {source ? <img src={source} alt="Původní fotka" className="h-full w-full object-cover" /> : <span className="p-4 text-center text-sm text-faint">Vyber nebo nahraj fotku</span>}
            </div>
          </figure>
          <figure className="space-y-1.5">
            <figcaption className="label">Výsledek</figcaption>
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-line bg-bg">
              {busy ? <Loader2 className="animate-spin text-brand" /> : result ? <img src={result} alt="Upravená fotka" className="h-full w-full object-cover" /> : <span className="p-4 text-center text-sm text-faint">Tady se objeví úprava</span>}
            </div>
          </figure>
          {result && (
            <div className="col-span-2 flex gap-2">
              <a className="btn-ghost flex-1" href={result} download={`offsidestore-trend-${Date.now()}.png`}>
                <Download size={15} /> Stáhnout
              </a>
              <button className="btn-ghost flex-1" onClick={() => setSource(result)} title="Pokračovat v úpravách výsledku">
                <RotateCcw size={15} /> Upravovat dál
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
