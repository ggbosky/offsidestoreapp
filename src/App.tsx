import { useEffect, useState } from 'react';
import { useData } from './store/data';
import { useLock } from './store/lock';
import { applyAccent } from './lib/color';
import { LockScreen } from './features/lock/LockScreen';
import { Header, type TabId } from './components/Header';
import { Toasts } from './components/Toasts';
import { ProductionPage } from './features/production/ProductionPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { CalculatorPage } from './features/calculator/CalculatorPage';
import { SocialPage } from './features/social/SocialPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  const unlocked = useLock((s) => s.unlocked);
  const lock = useLock((s) => s.lock);
  const accent = useData((s) => s.settings.accent);
  const autoLock = useData((s) => s.settings.autoLockMinutes);
  const [tab, setTab] = useState<TabId>('production');

  useEffect(() => applyAccent(accent), [accent]);

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

  // Rychlé zamčení klávesou Ctrl/Cmd + L
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
    <div className="ice-bg min-h-full">
      <Header tab={tab} onTab={setTab} />
      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6">
        {tab === 'production' && <ProductionPage />}
        {tab === 'inventory' && <InventoryPage />}
        {tab === 'calculator' && <CalculatorPage onGoToQueue={() => setTab('production')} />}
        {tab === 'social' && <SocialPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <Toasts />
    </div>
  );
}
