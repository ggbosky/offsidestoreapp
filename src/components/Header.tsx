import { Calculator, Factory, Lock, Megaphone, Package, Save, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { Logo } from './Logo';
import { useData, getAppData } from '../store/data';
import { useLock } from '../store/lock';
import { OPEN_STATUSES, stockAlerts } from '../lib/inventory';
import { backupFileName, createBackup, downloadJson } from '../lib/backup';
import { toast } from '../store/toast';

export type TabId = 'production' | 'inventory' | 'calculator' | 'social' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: typeof Factory }> = [
  { id: 'production', label: 'Výrobní fronta', icon: Factory },
  { id: 'inventory', label: 'Sklad', icon: Package },
  { id: 'calculator', label: 'Kalkulačka', icon: Calculator },
  { id: 'social', label: 'Sítě', icon: Megaphone },
];

export function exportBackupNow() {
  downloadJson(createBackup(getAppData()), backupFileName());
  useData.getState().markBackup();
  toast('Záloha uložena do složky Stažené soubory.');
}

export function Header({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  const lock = useLock((s) => s.lock);
  const orders = useData((s) => s.orders);
  const laces = useData((s) => s.laces);
  const chars = useData((s) => s.chars);
  const endcaps = useData((s) => s.endcaps);
  const settings = useData((s) => s.settings);

  const openCount = useMemo(() => orders.filter((o) => OPEN_STATUSES.has(o.status)).length, [orders]);
  const alertCount = useMemo(() => stockAlerts({ laces, chars, endcaps, settings }).length, [laces, chars, endcaps, settings]);

  const badge = (id: TabId) => {
    if (id === 'production' && openCount) return <span className="rounded-full bg-accent/20 px-1.5 text-[11px] font-bold text-accent">{openCount}</span>;
    if (id === 'inventory' && alertCount) return <span className="rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{alertCount}</span>;
    return null;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ice-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6">
        <button onClick={() => onTab('production')} className="shrink-0" aria-label="Domů">
          <Logo />
        </button>

        <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                tab === id ? 'bg-accent/15 text-accent' : 'text-ink-muted hover:bg-white/[0.05] hover:text-ink'
              }`}
            >
              <Icon size={17} />
              <span className="hidden md:inline">{label}</span>
              {badge(id)}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button className="btn-icon" onClick={exportBackupNow} title="Rychlá záloha dat (JSON)">
            <Save size={18} />
          </button>
          <button
            className={`btn-icon ${tab === 'settings' ? 'bg-accent/15 text-accent' : ''}`}
            onClick={() => onTab('settings')}
            title="Nastavení"
          >
            <Settings size={18} />
          </button>
          <button className="btn-ghost ml-1 py-2" onClick={lock} title="Zamknout (Ctrl+L)">
            <Lock size={16} /> Zamknout
          </button>
        </div>
      </div>
      <div className="lace-stripe opacity-70" />
    </header>
  );
}
