import { useEffect } from 'react';
import { useData } from './store/data';
import { useLock } from './store/lock';
import { useUi } from './store/ui';
import { LockScreen } from './features/lock/LockScreen';
import { Header } from './components/Header';
import { Toasts } from './components/Toasts';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ContentPage } from './features/content/ContentPage';
import { ContentEditor } from './features/content/ContentEditor';
import { CrmPage } from './features/crm/CrmPage';
import { ContactEditor } from './features/crm/ContactEditor';
import { BraceletsPage } from './features/bracelets/BraceletsPage';
import { BraceletEditor } from './features/bracelets/BraceletEditor';
import { GeneratorPage } from './features/generator/GeneratorPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  const unlocked = useLock((s) => s.unlocked);
  const lock = useLock((s) => s.lock);
  const autoLock = useData((s) => s.settings.autoLockMinutes);
  const tab = useUi((s) => s.tab);

  // Automatické zamčení po nečinnosti
  useEffect(() => {
    if (!unlocked || !autoLock) return;
    let timer = window.setTimeout(lock, autoLock * 60_000);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, autoLock * 60_000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [unlocked, autoLock, lock]);

  // Ctrl/Cmd + L = zamknout
  useEffect(() => {
    if (!unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked, lock]);

  if (!unlocked) {
    return (
      <>
        <LockScreen />
        <Toasts />
      </>
    );
  }

  return (
    <div className="min-h-full bg-bg">
      <Header />
      <main className="mx-auto max-w-[1480px] px-4 pb-20 pt-7 sm:px-6">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'content' && <ContentPage />}
        {tab === 'crm' && <CrmPage />}
        {tab === 'bracelets' && <BraceletsPage />}
        {tab === 'generator' && <GeneratorPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <ContentEditor />
      <ContactEditor />
      <BraceletEditor />
      <ConfirmDialog />
      <Toasts />
    </div>
  );
}
