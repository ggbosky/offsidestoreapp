import { useState } from 'react';
import { ExternalLink, Send, Trash2 } from 'lucide-react';
import type { Contact, InteractionType } from '../../types';
import { useData } from '../../store/data';
import { useUi } from '../../store/ui';
import { Field, Modal, NumberInput } from '../../components/ui';
import { LaceDot } from '../../components/BraceletGraphic';
import { CONTACT_KINDS, CRM_STAGES, INTERACTIONS } from '../../lib/meta';
import { addDays, formatShort, today } from '../../lib/dates';
import { uid } from '../../lib/id';
import { askConfirm } from '../../store/confirm';
import { toast } from '../../store/toast';
import { StageTag } from '../content/bits';

export function ContactEditor() {
  const item = useUi((s) => s.contact);
  const open = useUi((s) => s.openContact);
  const exists = useData((s) => (item ? s.contacts.some((c) => c.id === item.id) : false));
  return (
    <Modal open={!!item} onClose={() => open(null)} title={exists ? 'Kontakt' : 'Nový kontakt'} wide>
      {item && <Body key={item.id} initial={item} exists={exists} onClose={() => open(null)} />}
    </Modal>
  );
}

const igUrl = (h: string) => (h.startsWith('http') ? h : `https://instagram.com/${h.replace(/^@/, '')}`);
const ttUrl = (h: string) => (h.startsWith('http') ? h : `https://www.tiktok.com/@${h.replace(/^@/, '')}`);

function Body({ initial, exists, onClose }: { initial: Contact; exists: boolean; onClose: () => void }) {
  const { clubs, content, saveContact, deleteContact } = useData();
  const openContent = useUi((s) => s.openContent);
  const [c, setC] = useState<Contact>(initial);
  const [type, setType] = useState<InteractionType>('dm');
  const [text, setText] = useState('');
  const [date, setDate] = useState(today());
  const set = (patch: Partial<Contact>) => setC((x) => ({ ...x, ...patch }));
  const linked = content.filter((x) => x.contactIds.includes(c.id));

  function addInteraction() {
    if (!text.trim()) return;
    set({
      interactions: [{ id: uid('i'), date, type, text: text.trim() }, ...c.interactions].sort((a, b) => b.date.localeCompare(a.date)),
      stage: c.stage === 'tip' && type !== 'poznamka' ? 'osloveno' : c.stage,
    });
    setText('');
  }

  function save() {
    if (!c.name.trim()) {
      toast('Doplň jméno kontaktu.', 'warn');
      return;
    }
    saveContact({ ...c, name: c.name.trim() });
    toast('Kontakt uložen.');
    onClose();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-4">
        <input
          className="w-full border-0 border-b border-line-2 bg-transparent pb-2 text-2xl font-extrabold placeholder:text-faint focus:border-brand focus:outline-none"
          placeholder="Jméno / název"
          value={c.name}
          onChange={(e) => set({ name: e.target.value })}
          autoFocus={!exists}
        />
        <div className="flex flex-wrap gap-1.5">
          {CRM_STAGES.map((s) => (
            <button key={s.id} type="button" onClick={() => set({ stage: s.id })} className={`chip ${c.stage === s.id ? 'chip-on' : 'chip-off'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Typ">
            <select className="input" value={c.kind} onChange={(e) => set({ kind: e.target.value as Contact['kind'] })}>
              {Object.entries(CONTACT_KINDS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sledující (orientačně)">
            <NumberInput value={c.followers ?? 0} onChange={(v) => set({ followers: v || null })} min={0} />
          </Field>
          <Field label="Instagram">
            <div className="flex gap-1">
              <input className="input" value={c.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@ucet" />
              {c.instagram && (
                <a className="btn-icon" href={igUrl(c.instagram)} target="_blank" rel="noreferrer" aria-label="Otevřít Instagram">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </Field>
          <Field label="TikTok">
            <div className="flex gap-1">
              <input className="input" value={c.tiktok} onChange={(e) => set({ tiktok: e.target.value })} placeholder="@ucet" />
              {c.tiktok && (
                <a className="btn-icon" href={ttUrl(c.tiktok)} target="_blank" rel="noreferrer" aria-label="Otevřít TikTok">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" value={c.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Telefon">
            <input className="input" value={c.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
        </div>

        <div>
          <div className="label">Kluby</div>
          <div className="flex flex-wrap gap-1.5">
            {clubs.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => set({ clubIds: c.clubIds.includes(k.id) ? c.clubIds.filter((x) => x !== k.id) : [...c.clubIds, k.id] })}
                className={`chip ${c.clubIds.includes(k.id) ? 'chip-on' : 'chip-off'}`}
              >
                <LaceDot color={k.laceColor} className="h-3 w-3" /> {k.abbr}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand/40 bg-brand/[0.06] p-4">
          <div className="label text-white">Další krok</div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input className="input" value={c.nextAction} onChange={(e) => set({ nextAction: e.target.value })} placeholder="Poslat náramek KOM, zeptat se na termín videa…" />
            <input type="date" className="input sm:w-44" value={c.nextDate ?? ''} onChange={(e) => set({ nextDate: e.target.value || null })} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              ['Zítra', 1],
              ['Za 3 dny', 3],
              ['Za týden', 7],
              ['Za 14 dní', 14],
            ].map(([l, n]) => (
              <button key={l} type="button" className="chip chip-off" onClick={() => set({ nextDate: addDays(today(), n as number) })}>
                {l}
              </button>
            ))}
            {c.nextDate && (
              <button type="button" className="chip chip-off" onClick={() => set({ nextDate: null })}>
                Bez připomínky
              </button>
            )}
          </div>
        </div>

        <Field label="Štítky (oddělit čárkou)">
          <input
            className="input"
            value={c.tags.join(', ')}
            onChange={(e) => set({ tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
            placeholder="giveaway, unboxing, derby"
          />
        </Field>
        <Field label="Poznámky">
          <textarea className="input min-h-[80px]" value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Co ho baví, jak komunikuje, na čem jste se dohodli…" />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-bg/60 p-4">
          <div className="label">Zapsat komunikaci</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select className="input py-2" value={type} onChange={(e) => setType(e.target.value as InteractionType)}>
              {Object.entries(INTERACTIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input type="date" className="input w-40 py-2" value={date} onChange={(e) => setDate(e.target.value || today())} />
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="input py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Co se stalo?"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInteraction();
                }
              }}
            />
            <button type="button" className="btn-ghost px-3" onClick={addInteraction} aria-label="Zapsat">
              <Send size={15} />
            </button>
          </div>
          <ol className="mt-4 max-h-72 space-y-3 overflow-y-auto border-l border-line-2 pl-4">
            {c.interactions.map((i) => (
              <li key={i.id} className="group relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-brand" />
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-faint">
                  {formatShort(i.date)} · {INTERACTIONS[i.type]}
                  <button
                    type="button"
                    className="ml-auto hidden text-faint hover:text-danger group-hover:block"
                    onClick={() => set({ interactions: c.interactions.filter((x) => x.id !== i.id) })}
                    aria-label="Smazat záznam"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-sm">{i.text}</p>
              </li>
            ))}
            {!c.interactions.length && <li className="text-sm text-faint">Zatím žádná komunikace.</li>}
          </ol>
        </div>

        {linked.length > 0 && (
          <div className="rounded-2xl border border-line bg-bg/60 p-4">
            <div className="label">Společný obsah</div>
            <div className="space-y-1.5">
              {linked.map((x) => (
                <button key={x.id} type="button" onClick={() => openContent(x)} className="block w-full rounded-lg bg-surface-2 px-3 py-2 text-left text-sm hover:bg-surface-3">
                  <div className="font-bold">{x.title}</div>
                  <StageTag stage={x.stage} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1 py-3">
            Uložit kontakt
          </button>
          {exists && (
            <button
              type="button"
              className="btn-danger"
              aria-label="Smazat kontakt"
              onClick={async () => {
                if (await askConfirm(`Smazat kontakt „${c.name}“ včetně historie?`)) {
                  deleteContact(c.id);
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
