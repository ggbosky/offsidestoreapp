import { CalendarDays, Gauge, Gem, Lock, Save, Settings, Sparkles, Users } from 'lucide-react';
import { Logo } from './Logo';
import { useData, getAppData } from '../store/data';
import { useLock } from '../store/lock';
import { useUi, type TabId } from '../store/ui';
import { attentionCount } from '../lib/selectors';
import { backupFileName, createBackup, downloadJson } from '../lib/backup';
import { toast } from '../store/toast';

const TABS: Array<{ id: TabId; label: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Přehled', icon: Gauge },
  { id: 'content', label: 'Obsah', icon: CalendarDays },
  { id: 'crm', label: 'Kontakty', icon: Users },
  { id: 'bracelets', label: 'Náramky', icon: Gem },
  { id: 'generator', label: 'Generátor', icon: Sparkles },
];

export function exportBackupNow() {
  downloadJson(createBackup(getAppData()), backupFileName());
  useData.getState().markBackup();
  toast('Záloha uložena do Stažených souborů.');
}

export function Header() {
  const lock = useLock((s) => s.lock);
  const { tab, setTab } = useUi();
  const content = useData((s) => s.content);
  const contacts = useData((s) => s.contacts);
  const att = attentionCount({ content, contacts });

  const badge = (id: TabId) => {
    const n = id === 'content' ? att.content : id === 'crm' ? att.contacts : 0;
    return n ? <span className="rounded-full bg-brand px-1.5 text-[11px] font-extrabold leading-5 text-white">{n}</span> : null;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 sm:px-6">
        <button onClick={() => setTab('dashboard')} className="shrink-0 py-3" aria-label="Přehled">
          <Logo />
        </button>
        <nav className="ml-3 flex flex-1 items-stretch gap-1 self-stretch overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 text-sm font-bold uppercase tracking-[0.08em] transition ${
                tab === id ? 'text-white' : 'text-muted hover:text-white'
              }`}
            >
              <Icon size={17} />
              <span className="hidden lg:inline">{label}</span>
              {badge(id)}
              {tab === id && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-brand" />}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <button className="btn-icon" onClick={exportBackupNow} title="Rychlá záloha (JSON)">
            <Save size={18} />
          </button>
          <button className={`btn-icon ${tab === 'settings' ? 'text-white' : ''}`} onClick={() => setTab('settings')} title="Nastavení">
            <Settings size={18} />
          </button>
          <button className="btn-ghost ml-1 py-2" onClick={lock} title="Zamknout (Ctrl+L)">
            <Lock size={15} /> <span className="hidden sm:inline">Zamknout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
