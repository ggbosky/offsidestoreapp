import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarHeart, CheckCircle2, Circle, Database, Download, KeyRound, Loader2, Plug, Plus, RotateCcw, Shield, Tag, Trash2, Upload, Users } from 'lucide-react';
import { useIntegrations } from '../../store/integrations';
import { refreshShopify } from '../shopify/ShopifyPanel';
import { api } from '../../lib/api';
import { useEffect } from 'react';
import { useData, getAppData } from '../../store/data';
import { Field, NumberInput } from '../../components/ui';
import { LaceDot } from '../../components/BraceletGraphic';
import { LACE_COLORS } from '../../config';
import { parseBackup } from '../../lib/backup';
import { sha256Hex, verifyPassword } from '../../lib/auth';
import { DEFAULT_CLUBS } from '../../data/seed';
import { uid } from '../../lib/id';
import { formatShort, today } from '../../lib/dates';
import { toast } from '../../store/toast';
import { askConfirm } from '../../store/confirm';
import { exportBackupNow } from '../../components/Header';

function Section({ icon, title, children, className = '' }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card space-y-4 p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-brand">{icon}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="h-display text-3xl">Nastavení</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <IntegrationsSection />
        <DataSection />
        <SecuritySection />
        <KeyDatesSection />
        <PricingSection />
        <ClubsSection />
      </div>
    </div>
  );
}

function DataSection() {
  const { settings, content, contacts, replaceAll, resetDemo } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
  const days = last ? Math.floor((Date.now() - last.getTime()) / 86_400_000) : null;

  async function onImport(file: File) {
    try {
      const data = parseBackup(await file.text());
      const ok = await askConfirm(
        `Obnovit zálohu „${file.name}“?\n\nV záloze: ${data.content.length} obsahů, ${data.contacts.length} kontaktů.\nSoučasná data (${content.length} obsahů, ${contacts.length} kontaktů) se přepíšou.`,
      );
      if (!ok) return;
      replaceAll({ ...data, settings: { ...data.settings, passwordHash: data.settings.passwordHash ?? settings.passwordHash } });
      toast('Záloha obnovena.');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <Section icon={<Database size={20} />} title="Data a zálohy" className="lg:col-span-2">
      <p className="max-w-3xl text-sm text-muted">
        Obsah, kontakty a náramky se ukládají automaticky jen v tomto počítači. Jednou týdně si stáhni zálohu (disk, flashka, cloud) – je to jeden soubor a jde zpátky nahrát.
      </p>
      <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${days === null || days > 7 ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>
        {last ? `Poslední záloha: ${last.toLocaleString('cs-CZ')} (${days === 0 ? 'dnes' : `před ${days} dny`})` : 'Zatím žádná záloha.'}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={exportBackupNow}>
          <Download size={16} /> Stáhnout zálohu
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Nahrát zálohu
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onImport(f);
          }}
        />
        <button
          className="btn-ghost ml-auto"
          onClick={async () => {
            if (await askConfirm('Nahradit všechna data ukázkovými? Doporučuji nejdřív stáhnout zálohu.')) {
              resetDemo();
              toast('Načtena ukázková data.');
            }
          }}
        >
          <RotateCcw size={16} /> Ukázková data
        </button>
        <button
          className="btn-danger"
          onClick={async () => {
            if (!(await askConfirm('Smazat ukázkový obsah a kontakty a začít naostro? Kluby, náramky a příležitosti zůstanou.'))) return;
            const d = getAppData();
            replaceAll({ ...d, content: [], contacts: [], bracelets: d.bracelets.filter((b) => b.clubId) });
            toast('Hotovo – můžeš začít naostro.');
          }}
        >
          <Trash2 size={16} /> Začít naostro
        </button>
      </div>
    </Section>
  );
}

function SecuritySection() {
  const { settings, updateSettings } = useData();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function change(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!(await verifyPassword(cur, settings.passwordHash))) return setErr('Současné heslo nesouhlasí.');
    if (next.length < 6) return setErr('Nové heslo musí mít alespoň 6 znaků.');
    if (next !== again) return setErr('Hesla se neshodují – překlep?');
    updateSettings({ passwordHash: await sha256Hex(next) });
    setCur('');
    setNext('');
    setAgain('');
    toast('Heslo změněno. Platí od dalšího odemčení.');
  }

  return (
    <Section icon={<Shield size={20} />} title="Zabezpečení">
      <form onSubmit={change} className="space-y-3">
        <Field label="Současné heslo">
          <input id="pw-cur" type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nové heslo">
            <input id="pw-new" type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Nové heslo znovu">
            <input id="pw-again" type="password" className={`input ${again && again !== next ? 'border-danger' : ''}`} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <button className="btn-ghost" disabled={!cur || !next}>
          <KeyRound size={16} /> Změnit heslo
        </button>
      </form>
      <Field label="Automatické zamčení" hint="Rychlé zamčení kdykoliv: Ctrl + L.">
        <select className="input" value={settings.autoLockMinutes} onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}>
          <option value={0}>Vypnuto</option>
          {[5, 10, 15, 30, 60].map((m) => (
            <option key={m} value={m}>
              po {m} min nečinnosti
            </option>
          ))}
        </select>
      </Field>
    </Section>
  );
}

function KeyDatesSection() {
  const { keyDates, saveKeyDate, deleteKeyDate } = useData();
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  return (
    <Section icon={<CalendarHeart size={20} />} title="Příležitosti v kalendáři">
      <p className="text-sm text-muted">Derby, start play-off, svátky, výprodeje… Zobrazí se v Přehledu i v kalendáři obsahu.</p>
      <form
        className="grid gap-2 sm:grid-cols-[150px_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          saveKeyDate({ id: uid('kd'), date, title: title.trim(), note: note.trim() });
          setTitle('');
          setNote('');
        }}
      >
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value || today())} aria-label="Datum" />
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Derby LIT vs. SPA" aria-label="Název" />
        <button className="btn-ghost px-4" aria-label="Přidat">
          <Plus size={16} />
        </button>
        <input className="input sm:col-span-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Poznámka (nepovinné)" aria-label="Poznámka" />
      </form>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {keyDates.map((k) => (
          <li key={k.id} className={`flex items-center gap-3 py-2 ${k.date < today() ? 'opacity-45' : ''}`}>
            <span className="w-24 shrink-0 text-sm font-bold text-muted">{formatShort(k.date)}</span>
            <span className="min-w-0 flex-1">
              <span className="font-bold">{k.title}</span>
              {k.note && <span className="block truncate text-xs text-faint">{k.note}</span>}
            </span>
            <button className="btn-icon hover:text-danger" onClick={() => deleteKeyDate(k.id)} aria-label={`Smazat ${k.title}`}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PricingSection() {
  const { settings, updateSettings } = useData();
  return (
    <Section icon={<Tag size={20} />} title="Ceník z webu">
      <p className="text-sm text-muted">Jen pro texty a náhledy (např. „od 290 Kč“). Objednávky a tržby řeší Shopify.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Základní cena">
          <NumberInput value={settings.basePrice} onChange={(v) => updateSettings({ basePrice: v })} suffix="Kč" />
        </Field>
        <Field label="Znaků v ceně">
          <NumberInput value={settings.includedChars} onChange={(v) => updateSettings({ includedChars: v })} />
        </Field>
        <Field label="Každý další znak">
          <NumberInput value={settings.extraCharPrice} onChange={(v) => updateSettings({ extraCharPrice: v })} suffix="Kč" />
        </Field>
        <Field label="Maximum znaků">
          <NumberInput value={settings.maxChars} onChange={(v) => updateSettings({ maxChars: Math.max(1, v) })} />
        </Field>
      </div>
    </Section>
  );
}

function ClubsSection() {
  const { clubs, saveClub, deleteClub } = useData();
  return (
    <Section icon={<Users size={20} />} title="Kluby" className="lg:col-span-2">
      <p className="text-sm text-muted">Barvy tkaniček odpovídají fotkám na offsidestore.cz. Změny se projeví v generátoru, náramcích i kontaktech.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="pb-2 pr-2">Název</th>
              <th className="pb-2 pr-2">Krátce</th>
              <th className="pb-2 pr-2">Zkratka</th>
              <th className="pb-2 pr-2">Tkanička</th>
              <th className="pb-2 pr-2">Hashtag</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id}>
                <td className="py-1 pr-2">
                  <input className="input py-1.5" value={c.name} onChange={(e) => saveClub({ ...c, name: e.target.value })} aria-label="Název klubu" />
                </td>
                <td className="py-1 pr-2">
                  <input className="input py-1.5" value={c.short} onChange={(e) => saveClub({ ...c, short: e.target.value })} aria-label="Krátký název" />
                </td>
                <td className="w-24 py-1 pr-2">
                  <input className="input py-1.5 text-center font-extrabold uppercase" maxLength={4} value={c.abbr} onChange={(e) => saveClub({ ...c, abbr: e.target.value.toUpperCase() })} aria-label="Zkratka" />
                </td>
                <td className="py-1 pr-2">
                  <div className="flex items-center gap-2">
                    <LaceDot color={c.laceColor} className="h-5 w-5" />
                    <select className="input py-1.5" value={c.laceColor} onChange={(e) => saveClub({ ...c, laceColor: e.target.value })} aria-label="Barva tkaničky">
                      {LACE_COLORS.map((l) => (
                        <option key={l.hex} value={l.hex}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-1 pr-2">
                  <input className="input py-1.5 text-sky" value={c.hashtag} onChange={(e) => saveClub({ ...c, hashtag: e.target.value })} aria-label="Hashtag" />
                </td>
                <td className="py-1">
                  <button className="btn-icon hover:text-danger" onClick={async () => (await askConfirm(`Odebrat klub ${c.name}?`)) && deleteClub(c.id)} aria-label="Odebrat klub">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => saveClub({ id: uid('club'), name: 'NOVÝ KLUB', short: 'Nový', abbr: 'NEW', laceColor: '#B01E28', hashtag: '#hokej' })}>
          <Plus size={16} /> Přidat klub
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            const missing = DEFAULT_CLUBS.filter((d) => !clubs.some((c) => c.id === d.id));
            missing.forEach((m) => saveClub({ ...m }));
            toast(missing.length ? `Obnoveno ${missing.length} klubů.` : 'Všech 12 klubů z webu už v seznamu je.', 'info');
          }}
        >
          <RotateCcw size={16} /> Obnovit kluby z webu
        </button>
      </div>
    </Section>
  );
}

function IntegrationsSection() {
  const { status, serverError, loadStatus } = useIntegrations();
  const [busy, setBusy] = useState(false);
  const rows = [
    { name: 'Claude (hledání trendů a nápady)', ok: status?.anthropic.configured, detail: status ? `model ${status.anthropic.model}` : '' },
    { name: 'Shopify (objednávky, produkty, stálí zákazníci)', ok: status?.shopify.configured, detail: status?.shopify.store ? `${status.shopify.store} · ${status.shopify.mode === 'admin_token' ? 'token z adminu' : 'Dev Dashboard'}` : '' },
    { name: 'Gemini (úprava fotek)', ok: status?.gemini.configured, detail: status ? `model ${status.gemini.model}` : '' },
  ];

  async function verify() {
    setBusy(true);
    await loadStatus();
    const st = useIntegrations.getState().status;
    if (st?.shopify.configured) {
      try {
        const s = await refreshShopify();
        toast(`Shopify funguje: ${s.orders} objednávek za ${s.days} dní.`);
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    } else if (st) toast('Stav propojení načten.', 'info');
    setBusy(false);
  }

  return (
    <Section icon={<Plug size={20} />} title="Propojení" className="lg:col-span-2">
      {serverError ? (
        <p className="rounded-xl bg-warn/10 p-3 text-sm text-warn">{serverError}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-3">
          {rows.map((r) => (
            <li key={r.name} className={`flex items-start gap-2 rounded-xl border p-3 ${r.ok ? 'border-ok/30 bg-ok/[0.05]' : 'border-line bg-surface-2'}`}>
              {r.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" /> : <Circle size={18} className="mt-0.5 shrink-0 text-faint" />}
              <span>
                <span className="block font-bold">{r.name}</span>
                <span className="text-xs text-faint">{r.ok ? r.detail : 'Nepropojeno'}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <KeysForm onSaved={verify} />
      <button className="btn-ghost" onClick={verify} disabled={busy}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Ověřit propojení
      </button>
      <details className="rounded-xl border border-line bg-bg/50 p-4 text-sm text-muted">
        <summary className="cursor-pointer font-bold text-white">Kde klíče vzít (5 minut)</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Klíče vlož do formuláře výše a klikni na „Uložit klíče“. Zůstanou jen v tomto počítači a do prohlížeče se nikdy nedostanou.</li>
          <li>
            <b className="text-white">Claude:</b> na platform.claude.com → API Keys vytvoř klíč a vlož ho do pole „Claude API klíč“.
          </li>
          <li>
            <b className="text-white">Shopify:</b> v adminu Nastavení → Aplikace → Vývoj aplikací → vytvoř aplikaci v Dev Dashboardu. V konfiguraci zapni oprávnění
            <code> read_orders</code>, <code>read_products</code> (a volitelně <code>read_customers</code> + přístup k chráněným zákaznickým datům pro import stálých zákazníků), vydej verzi a nainstaluj ji do obchodu.
            Do formuláře vyplň obchod (část adresy před .myshopify.com), Client ID a Client secret. Máš-li starší aplikaci s tokenem <code>shpat_…</code>, stačí ten.
          </li>
          <li>
            <b className="text-white">Gemini:</b> na aistudio.google.com → Get API key a vlož ho do pole „Gemini API klíč“.
          </li>
          <li>Ulož a klikni na „Ověřit propojení“.</li>
        </ol>
      </details>
    </Section>
  );
}

const KEY_FIELDS: Array<{ name: string; label: string; placeholder: string; secret: boolean }> = [
  { name: 'ANTHROPIC_API_KEY', label: 'Claude API klíč', placeholder: 'sk-ant-…', secret: true },
  { name: 'SHOPIFY_STORE', label: 'Shopify obchod (část před .myshopify.com)', placeholder: 'např. offsidestore', secret: false },
  { name: 'SHOPIFY_CLIENT_ID', label: 'Shopify Client ID', placeholder: 'z Dev Dashboardu', secret: false },
  { name: 'SHOPIFY_CLIENT_SECRET', label: 'Shopify Client secret', placeholder: 'z Dev Dashboardu', secret: true },
  { name: 'SHOPIFY_ADMIN_TOKEN', label: 'nebo starší Shopify token (shpat_…)', placeholder: 'jen u starší aplikace', secret: true },
  { name: 'GEMINI_API_KEY', label: 'Gemini API klíč', placeholder: 'AIza…', secret: true },
];

function KeysForm({ onSaved }: { onSaved: () => void }) {
  const [info, setInfo] = useState<{ editable: boolean; storage: 'encrypted' | 'file'; keys: Record<string, string> } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.keys().then(setInfo).catch(() => setInfo(null));
  }, []);

  if (!info?.editable) return null;

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveKeys(values);
      setValues({});
      setInfo(await api.keys());
      toast(info?.storage === 'file' ? 'Klíče uloženy (soubor klice.local v tomto počítači).' : 'Klíče uloženy (šifrovaně v tomto počítači).');
      onSaved();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-line bg-bg/50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {KEY_FIELDS.map((f) => {
          const current = info.keys[f.name];
          return (
            <Field key={f.name} label={f.label} hint={current ? `Uloženo: ${current}` : 'Zatím nenastaveno'}>
              <div className="flex gap-1">
                <input
                  id={`key-${f.name}`}
                  className="input font-mono text-sm"
                  type={f.secret ? 'password' : 'text'}
                  autoComplete="off"
                  placeholder={current ? 'ponechat beze změny' : f.placeholder}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
                {current && (
                  <button type="button" className="btn-icon" title="Smazat uložený klíč" onClick={() => setValues((v) => ({ ...v, [f.name]: '' }))}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {values[f.name] === '' && current && <span className="mt-1 block text-xs text-danger">Po uložení se smaže.</span>}
            </Field>
          );
        })}
      </div>
      <button className="btn-primary" disabled={saving || Object.keys(values).length === 0}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Uložit klíče
      </button>
    </form>
  );
}
