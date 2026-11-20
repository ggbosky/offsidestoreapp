import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { BraceletGraphic } from '../../components/BraceletGraphic';
import { verifyPassword } from '../../lib/auth';
import { useData } from '../../store/data';
import { useLock } from '../../store/lock';
import { BRAND, LOCK_COOLDOWN_SECONDS, LOCK_MAX_ATTEMPTS } from '../../config';

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
    <div className="ice-bg relative flex min-h-full items-center justify-center overflow-hidden px-6 py-12">
      {/* dekorativní náramky v pozadí */}
      <div className="pointer-events-none absolute -left-24 top-16 w-[620px] -rotate-12 opacity-[0.07]">
        <BraceletGraphic colors={['#F5F7FA', '#9BA3AF']} text="OFFSIDE" />
      </div>
      <div className="pointer-events-none absolute -right-32 bottom-16 w-[620px] rotate-[14deg] opacity-[0.07]">
        <BraceletGraphic colors={['#F5F7FA', '#9BA3AF']} text="STORE" />
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
          <div className="mb-5 flex items-center gap-2 text-sm text-ink-muted">
            <Lock size={16} className="text-accent" />
            Výroba je zamčená. Zadejte heslo.
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
            Odemknout výrobu <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          {BRAND.web} · data zůstávají jen v tomto počítači
        </p>
      </div>
    </div>
  );
}
