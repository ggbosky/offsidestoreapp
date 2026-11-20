import { useRef, useState, type ReactNode } from 'react';
import { Database, Download, KeyRound, Palette, Plus, RotateCcw, Shield, Tag, Trash2, Upload, Users, Wallet } from 'lucide-react';
import type { Club } from '../../types';
import { useData, getAppData } from '../../store/data';
import { Field, NumberInput } from '../../components/ui';
import { LaceSwatch } from '../../components/BraceletGraphic';
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '../../config';
import { parseBackup } from '../../lib/backup';
import { sha256Hex, verifyPassword } from '../../lib/auth';
import { createSeedData } from '../../data/seed';
import { formatCzk } from '../../lib/pricing';
import { uid } from '../../lib/id';
import { toast } from '../../store/toast';
import { exportBackupNow } from '../../components/Header';

function Section({ icon, title, children, className = '' }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card space-y-4 p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DataSection />
      <SecuritySection />
      <PricingSection />
      <CostsSection />
      <AppearanceSection />
      <ClubsSection />
    </div>
  );
}

// ───────────── Data ─────────────
function DataSection() {
  const { settings, orders, replaceAll, resetDemo } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
  const days = last ? Math.floor((Date.now() - last.getTime()) / 86_400_000) : null;

  async function onImport(file: File) {
    try {
      const data = parseBackup(await file.text());
      if (!confirm(`Obnovit zálohu „${file.name}“?\n\nObjednávek v záloze: ${data.orders.length}\nSoučasná data (${orders.length} objednávek) budou přepsána.`)) return;
      // heslo ponecháme současné, pokud v záloze není
      replaceAll({ ...data, settings: { ...data.settings, passwordHash: data.settings.passwordHash ?? settings.passwordHash } });
      toast('Záloha byla obnovena.');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <Section icon={<Database size={20} />} title="Data a zálohy" className="lg:col-span-2">
      <p className="text-sm text-ink-muted">
        Vše se ukládá automaticky do tohoto počítače (localStorage prohlížeče / aplikace). Pravidelně si stahujte zálohu – stačí jeden klik a soubor si dejte na disk,
        flashku nebo do cloudu.
      </p>
      <div className={`rounded-xl px-4 py-3 text-sm ${days === null || days > 7 ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>
        {last ? `Poslední záloha: ${last.toLocaleString('cs-CZ')} (${days === 0 ? 'dnes' : `před ${days} dny`})` : 'Zatím jste zálohu nestáhli.'}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={exportBackupNow}>
          <Download size={16} /> Exportovat zálohu (JSON)
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importovat zálohu
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
        <button
          className="btn-ghost ml-auto"
          onClick={() => {
            if (confirm('Nahradit všechna data ukázkovými (3 objednávky, výchozí sklad)? Doporučuji nejdřív stáhnout zálohu.')) {
              resetDemo();
              toast('Načtena ukázková data.');
            }
          }}
        >
          <RotateCcw size={16} /> Ukázková data
        </button>
        <button
          className="btn-danger"
          onClick={() => {
            if (!confirm('Smazat všechny objednávky a začít naostro? Sklad a nastavení zůstanou.')) return;
            const d = getAppData();
            replaceAll({ ...d, orders: [], orderSeq: 1 });
            toast('Objednávky smazány – můžete začít naostro.');
          }}
        >
          <Trash2 size={16} /> Začít naostro
        </button>
      </div>
    </Section>
  );
}

// ───────────── Zabezpečení ─────────────
function SecuritySection() {
  const { settings, updateSettings } = useData();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!(await verifyPassword(cur, settings.passwordHash))) return setErr('Současné heslo nesouhlasí.');
    if (next.length < 6) return setErr('Nové heslo musí mít alespoň 6 znaků.');
    if (next !== again) return setErr('Hesla se neshodují (překlep?).');
    updateSettings({ passwordHash: await sha256Hex(next) });
    setCur('');
    setNext('');
    setAgain('');
    toast('Heslo změněno. Platí od příštího odemčení.');
  }

  return (
    <Section icon={<Shield size={20} />} title="Zabezpečení">
      <form onSubmit={change} className="space-y-3">
        <Field label="Současné heslo">
          <input type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nové heslo">
            <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Nové heslo znovu">
            <input type="password" className={`input ${again && again !== next ? 'border-danger/60' : ''}`} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <button className="btn-ghost" disabled={!cur || !next}>
          <KeyRound size={16} /> Změnit heslo
        </button>
      </form>
      <div className="grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
        <Field label="Automatické zamčení" hint="Po nečinnosti se aplikace sama zamkne. Rychlé zamčení: Ctrl + L.">
          <select className="input" value={settings.autoLockMinutes} onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}>
            <option value={0}>Vypnuto</option>
            {[5, 10, 15, 30, 60].map((m) => (
              <option key={m} value={m}>
                po {m} min
              </option>
            ))}
          </select>
        </Field>
        <div className="text-xs text-ink-faint sm:pt-6">
          Heslo se ukládá jen jako SHA-256 hash. {settings.passwordHash ? 'Používáte vlastní heslo.' : 'Používáte výchozí heslo z konfigurace.'}
        </div>
      </div>
    </Section>
  );
}

// ───────────── Ceník ─────────────
function PricingSection() {
  const { settings, updateSettings } = useData();
  const p = settings.pricing;
  const set = (patch: Partial<typeof p>) => updateSettings({ pricing: { ...p, ...patch } });
  return (
    <Section icon={<Tag size={20} />} title="Ceník">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Základní cena">
          <NumberInput value={p.basePrice} onChange={(v) => set({ basePrice: v })} suffix="Kč" />
        </Field>
        <Field label="Znaků v základu">
          <NumberInput value={p.includedChars} onChange={(v) => set({ includedChars: v })} suffix="zn." />
        </Field>
        <Field label="Každý další znak">
          <NumberInput value={p.extraCharPrice} onChange={(v) => set({ extraCharPrice: v })} suffix="Kč" />
        </Field>
        <Field label="Maximum znaků">
          <NumberInput value={p.maxChars} onChange={(v) => set({ maxChars: Math.max(1, v) })} suffix="zn." />
        </Field>
      </div>
      <p className="text-xs text-ink-faint">
        Příklad: 8 znaků = {formatCzk(p.basePrice)} + {Math.max(0, 8 - p.includedChars)} × {p.extraCharPrice} Kč ={' '}
        {formatCzk(p.basePrice + Math.max(0, 8 - p.includedChars) * p.extraCharPrice)}. Změna ceníku neovlivní už zadané objednávky.
      </p>
    </Section>
  );
}

// ───────────── Náklady ─────────────
function CostsSection() {
  const { settings, updateSettings } = useData();
  const c = settings.costs;
  const set = (patch: Partial<typeof c>) => updateSettings({ costs: { ...c, ...patch } });
  return (
    <Section icon={<Wallet size={20} />} title="Náklady a spotřeba">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tkaničky na 1 náramek">
          <NumberInput value={c.lacePerBracelet} onChange={(v) => set({ lacePerBracelet: v })} suffix="Kč" />
        </Field>
        <Field label="1 znak / korálek">
          <NumberInput value={c.charEach} onChange={(v) => set({ charEach: v })} step={0.5} suffix="Kč" />
        </Field>
        <Field label="1 kovová koncovka">
          <NumberInput value={c.endcapEach} onChange={(v) => set({ endcapEach: v })} step={0.5} suffix="Kč" />
        </Field>
        <Field label="Obal, kartička, sáček">
          <NumberInput value={c.packaging} onChange={(v) => set({ packaging: v })} suffix="Kč" />
        </Field>
        <Field label="Koncovek na náramek">
          <NumberInput value={settings.endcapsPerBracelet} onChange={(v) => updateSettings({ endcapsPerBracelet: Math.max(0, v) })} suffix="ks" />
        </Field>
        <Field label="Limit zásoby znaků">
          <NumberInput value={settings.charMinQty} onChange={(v) => updateSettings({ charMinQty: Math.max(0, v) })} suffix="ks" />
        </Field>
      </div>
    </Section>
  );
}

// ───────────── Vzhled ─────────────
function AppearanceSection() {
  const { settings, updateSettings } = useData();
  return (
    <Section icon={<Palette size={20} />} title="Vzhled – akcentová barva">
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((p) => (
          <button
            key={p.hex}
            onClick={() => updateSettings({ accent: p.hex })}
            className={`chip ${settings.accent.toLowerCase() === p.hex.toLowerCase() ? 'border-ink text-ink' : 'border-white/10 text-ink-muted hover:text-ink'}`}
          >
            <span className="h-4 w-4 rounded-full" style={{ background: p.hex }} /> {p.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={settings.accent} onChange={(e) => updateSettings({ accent: e.target.value })} className="h-11 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
        <span className="font-mono text-sm text-ink-muted">{settings.accent.toUpperCase()}</span>
        <button className="btn-ghost ml-auto py-2 text-xs" onClick={() => updateSettings({ accent: DEFAULT_ACCENT })}>
          Výchozí
        </button>
      </div>
      <div className="lace-stripe rounded-full" />
    </Section>
  );
}

// ───────────── Kluby ─────────────
function ClubsSection() {
  const { clubs, laces, upsertClub, removeClub, orders } = useData();
  const seedClubs = createSeedData({ empty: true }).clubs;
  const addClub = () => {
    const c: Club = { id: uid('club'), name: 'Nový klub', short: 'NEW', laceId: laces[0]?.id ?? '', hashtag: '#hokej' };
    upsertClub(c);
  };
  return (
    <Section icon={<Users size={20} />} title="Kluby" className="lg:col-span-2">
      <p className="text-sm text-ink-muted">Barvy klubu se berou z přiřazené tkaničky (Sklad → Tkaničky). Barvy jsou orientační – upravte je podle skutečných tkaniček.</p>
      <div className="grid gap-2 md:grid-cols-2">
        {clubs.map((c) => {
          const lace = laces.find((l) => l.id === c.laceId);
          return (
            <div key={c.id} className="grid grid-cols-[auto_1fr_70px_1fr_auto] items-center gap-2 rounded-xl border border-white/[0.06] bg-ice-950/40 p-2">
              <LaceSwatch colors={lace?.colors ?? []} className="h-7 w-9" />
              <input className="input py-1.5" value={c.name} onChange={(e) => upsertClub({ ...c, name: e.target.value })} aria-label="Název klubu" />
              <input className="input py-1.5 text-center uppercase" value={c.short} maxLength={4} onChange={(e) => upsertClub({ ...c, short: e.target.value.toUpperCase() })} aria-label="Zkratka" />
              <select className="input py-1.5" value={c.laceId} onChange={(e) => upsertClub({ ...c, laceId: e.target.value })} aria-label="Tkanička">
                {laces.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button
                className="btn-icon hover:text-danger"
                title="Odebrat klub"
                onClick={() => {
                  const used = orders.filter((o) => o.clubId === c.id).length;
                  if (confirm(used ? `Klub má ${used} objednávek (zůstanou zachovány bez názvu klubu). Odebrat?` : `Odebrat klub ${c.name}?`)) removeClub(c.id);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost" onClick={addClub}>
          <Plus size={16} /> Přidat klub
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            const missing = seedClubs.filter((s) => !clubs.some((c) => c.id === s.id) && laces.some((l) => l.id === s.laceId));
            missing.forEach(upsertClub);
            toast(missing.length ? `Obnoveno ${missing.length} klubů.` : 'Všechny výchozí kluby už v seznamu jsou.', 'info');
          }}
        >
          <RotateCcw size={16} /> Obnovit výchozí kluby
        </button>
      </div>
    </Section>
  );
}
