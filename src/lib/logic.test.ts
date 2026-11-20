import { describe, expect, it } from 'vitest';
import { countChars, normalizeText, priceForChars, priceForText, validateText } from './pricing';
import { applyMaterial, braceletsPossible, stockAlerts } from './inventory';
import { quoteLines, quoteUniform } from './quote';
import { parseBackup, createBackup } from './backup';
import { sha256Fallback, sha256Hex, verifyPassword } from './auth';
import { createSeedData, DEFAULT_SETTINGS } from '../data/seed';
import { DEFAULT_PASSWORD_HASH } from '../config';

const P = DEFAULT_SETTINGS.pricing;

describe('ceník', () => {
  it('3 znaky v ceně 290 Kč, každý další +12 Kč', () => {
    expect(priceForChars(1, P)).toBe(290);
    expect(priceForChars(3, P)).toBe(290);
    expect(priceForChars(4, P)).toBe(302);
    expect(priceForChars(12, P)).toBe(290 + 9 * 12);
  });
  it('mezery se nepočítají, symboly ano', () => {
    expect(countChars('LVT 1945')).toBe(7);
    expect(priceForText('LVT 1945', P)).toBe(338);
    expect(countChars('#88 ♥')).toBe(4);
  });
  it('validace 1–12 znaků', () => {
    expect(validateText('', P).ok).toBe(false);
    expect(validateText('ABCDEFGHIJKL', P).ok).toBe(true);
    expect(validateText('ABCDEFGHIJKLM', P).ok).toBe(false);
  });
  it('normalizace na velká písmena', () => {
    expect(normalizeText('kometa  brno')).toBe('KOMETA BRNO');
  });
});

describe('sklad', () => {
  it('přepočet tkaniček na náramky', () => {
    expect(braceletsPossible({ id: 'x', name: 'x', colors: [], stockCm: 450, cmPerBracelet: 90, minBracelets: 1 })).toBe(5);
  });
  it('odečte a vrátí materiál', () => {
    const d = createSeedData();
    const order = { laceId: 'lace-kometa', text: 'AA B', endcapId: 'endcap-silver' };
    const before = { lace: d.laces.find((l) => l.id === 'lace-kometa')!.stockCm, a: d.chars.find((c) => c.char === 'A')!.qty, cap: d.endcaps[0].qty };
    const after = applyMaterial(d, order, -1);
    expect(after.laces.find((l) => l.id === 'lace-kometa')!.stockCm).toBe(before.lace - 90);
    expect(after.chars.find((c) => c.char === 'A')!.qty).toBe(before.a - 2);
    expect(after.endcaps[0].qty).toBe(before.cap - 2);
    const back = applyMaterial({ ...d, ...after }, order, +1);
    expect(back.chars.find((c) => c.char === 'A')!.qty).toBe(before.a);
  });
  it('hlídá limity', () => {
    const alerts = stockAlerts(createSeedData());
    expect(alerts.some((a) => a.id === 'lace-trencin')).toBe(true);
    expect(alerts.some((a) => a.id === 'Q')).toBe(true);
  });
});

describe('kalkulačka', () => {
  it('marže a sleva', () => {
    const q = quoteUniform(10, 5, 10, 'pct', DEFAULT_SETTINGS);
    expect(q.subtotal).toBe(3140);
    expect(q.total).toBe(2826);
    expect(q.margin).toBe(q.total - q.cost);
  });
  it('týmová objednávka ignoruje neplatné řádky', () => {
    const { quote, lines } = quoteLines(['NOVÁK 17', 'TOHLEJEMOCDLOUHE'], 0, DEFAULT_SETTINGS);
    expect(lines[1].valid).toBe(false);
    expect(quote.pieces).toBe(1);
  });
});

describe('zálohy', () => {
  it('export → import zachová data', () => {
    const d = createSeedData();
    const restored = parseBackup(JSON.stringify(createBackup(d)));
    expect(restored.orders).toHaveLength(3);
    expect(restored.laces.length).toBe(d.laces.length);
  });
  it('odmítne cizí soubor', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow();
    expect(() => parseBackup('nejson')).toThrow();
  });
});

describe('heslo', () => {
  it('JS záloha SHA-256 odpovídá WebCrypto', async () => {
    const hex = Array.from(sha256Fallback(new TextEncoder().encode('offside2026')), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe(DEFAULT_PASSWORD_HASH);
    expect(await sha256Hex('offside2026')).toBe(DEFAULT_PASSWORD_HASH);
  });
  it('ověření hesla', async () => {
    expect(await verifyPassword('offside2026', null)).toBe(true);
    expect(await verifyPassword('Offside2026', null)).toBe(false);
  });
});
