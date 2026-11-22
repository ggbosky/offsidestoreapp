import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Download, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { verifyPassword } from '../../lib/auth';
import { useData } from '../../store/data';
import { useLock } from '../../store/lock';
import { BRAND, DOWNLOAD, IS_DESKTOP_APP, LOCK_COOLDOWN_SECONDS, LOCK_MAX_ATTEMPTS } from '../../config';

export function LockScreen() {
  const unlock = useLock((s) => s.unlock);
  const passwordHash = useData((s) => s.settings.passwordHash);
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, Math.ceil((cooldownUntil - nowTs) / 1000));

  useEffect(() => {
    if (!cooldownUntil) return;
    const t = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(t);
  }, [cooldownUntil]);

  useEffect(() => {
    if (remaining === 0) inputRef.current?.focus();
  }, [remaining]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.('CapsLock') ?? false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (remaining > 0 || busy || !pw) return;
    setBusy(true);
    const ok = await verifyPassword(pw, passwordHash);
    setBusy(false);
    if (ok) {
      setError(null);
      unlock();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setShake((s) => s + 1);
    setPw('');
    if (next % LOCK_MAX_ATTEMPTS === 0) {
      setCooldownUntil(Date.now() + LOCK_COOLDOWN_SECONDS * 1000);
      setNowTs(Date.now());
      setError(`Příliš mnoho pokusů. Zkuste to znovu za ${LOCK_COOLDOWN_SECONDS} s.`);
    } else {
      const left = LOCK_MAX_ATTEMPTS - (next % LOCK_MAX_ATTEMPTS);
      const word = left === 1 ? 'pokus' : left < 5 ? 'pokusy' : 'pokusů';
      setError(`Špatné heslo. ${left < 5 && left > 1 ? 'Zbývají' : 'Zbývá'} ${left} ${word} před krátkým zablokováním.`);
    }
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-bg px-6 py-12">
      {/* červený přechod jako karty klubů na webu + náramky v pozadí */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_85%_-10%,rgba(176,30,40,0.45),transparent_60%),radial-gradient(700px_420px_at_0%_110%,rgba(52,10,14,0.9),transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 w-[640px] -rotate-[14deg] opacity-25">
        <BraceletGraphic color="#B01E28" text="SPA" sideLength={160} />
      </div>
      <div className="pointer-events-none absolute -right-28 bottom-16 w-[640px] rotate-[12deg] opacity-20">
        <BraceletGraphic color="#F2C300" text="LIT" sideLength={160} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" showClaim />
        </div>

        <form
          key={shake}
          onSubmit={submit}
          className={`card p-7 ${shake ? 'animate-shake' : ''} ${error ? 'border-danger/50' : ''}`}
        >
          <div className="mb-5 flex items-center gap-2 text-sm text-muted">
            <Lock size={16} className="text-brand" />
            Studio je zamčené. Zadejte heslo.
          </div>

          <label className="label" htmlFor="pw">
            Heslo
          </label>
          <div className="relative">
            <input
              id="pw"
              ref={inputRef}
              type={show ? 'text' : 'password'}
              autoFocus
              autoComplete="current-password"
              className={`input py-3.5 pr-12 text-base tracking-wider ${error ? 'border-danger/70 ring-2 ring-danger/20' : ''}`}
              placeholder="••••••••"
              value={pw}
              disabled={remaining > 0}
              onChange={(e) => {
                setPw(e.target.value);
                if (error && remaining === 0) setError(null);
              }}
              onKeyDown={onKey}
              onKeyUp={onKey}
              aria-invalid={!!error}
              aria-describedby="pw-msg"
            />
            <button
              type="button"
              className="btn-icon absolute right-1.5 top-1/2 -translate-y-1/2"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Skrýt heslo' : 'Zobrazit heslo'}
              tabIndex={-1}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div id="pw-msg" className="mt-2 min-h-[1.25rem] text-sm" aria-live="polite">
            {error ? (
              <span className="flex items-center gap-1.5 text-danger">
                <ShieldAlert size={14} />
                {remaining > 0 ? `Zablokováno – zkuste to za ${remaining} s.` : error}
              </span>
            ) : caps ? (
              <span className="text-warn">Pozor, je zapnutý Caps Lock.</span>
            ) : null}
          </div>

          <button type="submit" className="btn-primary mt-4 w-full py-3.5 text-base" disabled={!pw || remaining > 0 || busy}>
            Odemknout studio <ArrowRight size={18} />
          </button>
        </form>

        {!IS_DESKTOP_APP && <DownloadBox />}

        <p className="mt-6 text-center text-xs text-faint">
          {BRAND.web} · obsah, kontakty a nápady – data zůstávají jen v tomto počítači
        </p>
      </div>
    </div>
  );
}

/** Stažení desktopové aplikace – jen ve webové verzi. */
function DownloadBox() {
  const [help, setHelp] = useState(false);
  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface/80 p-5 backdrop-blur">
      <a href={DOWNLOAD.installer} target="_blank" rel="noreferrer" className="btn-ghost w-full border-white/25 py-3 text-base" onClick={() => setHelp(true)}>
        <Download size={18} /> Stáhnout pro Windows
      </a>
      <p className="mt-2 text-center text-xs text-faint">Desktopová aplikace se vším (trendy, Shopify, Gemini) · instalační soubor .exe</p>
      <button type="button" className="mx-auto mt-2 block text-xs font-bold text-muted hover:text-white" onClick={() => setHelp((v) => !v)}>
        {help ? 'Skrýt návod' : 'Jak nainstalovat?'}
      </button>
      {help && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Stažení se otevře na GitHubu (musíš být přihlášený svým účtem).</li>
          <li>
            Ve Stažených souborech spusť <b className="text-white">Offsidestore-Studio-Instalace.exe</b> a projdi instalací – vytvoří ikonu na ploše.
          </li>
          <li>
            Když prohlížeč stažení zastaví: u souboru <b className="text-white">… → Ponechat → Přesto ponechat</b>.
          </li>
          <li>
            Varování Windows: <b className="text-white">Další informace → Přesto spustit</b>. Avast: počkej na dokončení testu, případně{' '}
            <b className="text-white">Další možnosti</b>.
          </li>
          <li>
            Heslo: <b className="text-white">offside2026</b>. Klíče pro trendy a Shopify zadáš v aplikaci v Nastavení → Propojení.
          </li>
        </ol>
      )}
    </div>
  );
}
