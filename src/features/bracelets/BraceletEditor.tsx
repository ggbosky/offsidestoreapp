import { useRef, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import type { Bracelet, BraceletStatus } from '../../types';
import { useData } from '../../store/data';
import { useUi } from '../../store/ui';
import { Field, Modal } from '../../components/ui';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { BRACELET_STATUS } from '../../lib/meta';
import { LACE_COLORS, laceName } from '../../config';
import { countChars, normalizeText, priceForText } from '../../lib/pricing';
import { resizeImage } from '../../lib/image';
import { askConfirm } from '../../store/confirm';
import { toast } from '../../store/toast';

export function BraceletEditor() {
  const item = useUi((s) => s.bracelet);
  const open = useUi((s) => s.openBracelet);
  const exists = useData((s) => (item ? s.bracelets.some((b) => b.id === item.id) : false));
  return (
    <Modal open={!!item} onClose={() => open(null)} title={exists ? 'Upravit náramek' : 'Nový design / nápad'} wide>
      {item && <Body key={item.id} initial={item} exists={exists} onClose={() => open(null)} />}
    </Modal>
  );
}

function Body({ initial, exists, onClose }: { initial: Bracelet; exists: boolean; onClose: () => void }) {
  const { clubs, settings, saveBracelet, deleteBracelet } = useData();
  const [b, setB] = useState(initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Bracelet>) => setB((x) => ({ ...x, ...patch }));
  const n = countChars(b.letters);

  return (
    <form
      className="grid gap-6 md:grid-cols-[1fr_340px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!b.letters.trim() && !b.name.trim()) return toast('Doplň aspoň zkratku nebo název.', 'warn');
        saveBracelet({ ...b, name: b.name.trim() || b.letters });
        toast('Náramek uložen.');
        onClose();
      }}
    >
      <div className="space-y-4">
        <Field label="Klub">
          <select
            className="input"
            value={b.clubId ?? ''}
            onChange={(e) => {
              const club = clubs.find((c) => c.id === e.target.value);
              set(club ? { clubId: club.id, letters: b.letters || club.abbr, laceColor: club.laceColor, name: b.name || `${club.short} – ${club.abbr}` } : { clubId: null });
            }}
          >
            <option value="">Bez klubu (vlastní design)</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} – {c.abbr}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Písmena (${n}/${settings.maxChars})`} hint={`Cena na webu: ${priceForText(b.letters, settings)} Kč`}>
            <input className="input text-xl font-extrabold tracking-[0.2em]" value={b.letters} onChange={(e) => set({ letters: normalizeText(e.target.value).slice(0, 24) })} placeholder="LIT" />
          </Field>
          <Field label="Název">
            <input className="input" value={b.name} onChange={(e) => set({ name: e.target.value })} placeholder="Derby edice" />
          </Field>
        </div>
        {n > settings.maxChars && <p className="text-sm text-danger">Maximum na webu je {settings.maxChars} znaků.</p>}

        <div>
          <div className="label">Barva tkaničky – {laceName(b.laceColor)}</div>
          <div className="flex flex-wrap gap-2">
            {LACE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => set({ laceColor: c.hex })}
                className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface transition ${b.laceColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-brand' : 'ring-white/15 hover:ring-white/40'}`}
                style={{ background: c.hex }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="label">Stav</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BRACELET_STATUS) as BraceletStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => set({ status: s })} className={`chip ${b.status === s ? 'chip-on' : 'chip-off'}`}>
                {BRACELET_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Poznámky">
          <textarea className="input min-h-[90px]" value={b.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Pro koho, kdy uvést, nápad na focení…" />
        </Field>
      </div>

      <aside className="space-y-3">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_40%,#1D1D22,#050505_75%)]">
          {b.photo ? <img src={b.photo} alt="" className="h-full w-full object-cover" /> : <BraceletGraphic color={b.laceColor} text={b.letters || ' '} sideLength={50} className="w-[90%] -rotate-[8deg]" />}
        </div>
        {b.photo && <BraceletGraphic color={b.laceColor} text={b.letters || ' '} sideLength={40} className="w-full" />}
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} /> {b.photo ? 'Změnit fotku' : 'Přidat fotku'}
          </button>
          {b.photo && (
            <button type="button" className="btn-ghost px-3" onClick={() => set({ photo: undefined })} aria-label="Odebrat fotku">
              <X size={15} />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              set({ photo: await resizeImage(f) });
            } catch (err) {
              toast((err as Error).message, 'error');
            }
          }}
        />
        <p className="text-xs text-faint">Fotka se zmenší a uloží jen v tomto počítači (a v záloze).</p>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1 py-3">
            Uložit
          </button>
          {exists && (
            <button
              type="button"
              className="btn-danger"
              aria-label="Smazat"
              onClick={async () => {
                if (await askConfirm(`Smazat „${b.name}“? Z obsahu se odpojí.`)) {
                  deleteBracelet(b.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
