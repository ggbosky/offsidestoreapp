import { describe, expect, it } from 'vitest';
import { countChars, normalizeText, priceForText } from './pricing';
import { parseBackup, createBackup } from './backup';
import { sha256Fallback, sha256Hex, verifyPassword } from './auth';
import { addDays, diffDays, relative, startOfWeek } from './dates';
import { attentionCount, dueFollowUps, overdueContent, upcomingContent } from './selectors';
import { createSeedData, DEFAULT_SETTINGS } from '../data/seed';
import { DEFAULT_PASSWORD_HASH } from '../config';
import { generateIdeas } from '../features/generator/generator';

describe('ceník (jen pro texty)', () => {
  it('3 znaky v ceně, další +12 Kč', () => {
    expect(priceForText('LIT', DEFAULT_SETTINGS)).toBe(290);
    expect(priceForText('LVT 1945', DEFAULT_SETTINGS)).toBe(338);
    expect(countChars('#88 ♥')).toBe(4);
    expect(normalizeText('kometa  brno')).toBe('KOMETA BRNO');
  });
});

describe('data', () => {
  it('12 klubů z webu se správnými zkratkami', () => {
    const d = createSeedData();
    expect(d.clubs.map((c) => c.abbr)).toEqual(['LIT', 'SPA', 'PCE', 'JIH', 'VSE', 'ZLN', 'KOM', 'TRE', 'SLB', 'SLA', 'KLA', 'TRI']);
  });
  it('záloha: export → import', () => {
    const d = createSeedData();
    const r = parseBackup(JSON.stringify(createBackup(d)));
    expect(r.content).toHaveLength(d.content.length);
    expect(r.contacts).toHaveLength(d.contacts.length);
    expect(() => parseBackup('{"foo":1}')).toThrow();
    expect(() => parseBackup('nejson')).toThrow();
  });
});

describe('data a připomínky', () => {
  const t = '2026-11-20';
  it('datumové pomůcky', () => {
    expect(addDays(t, 12)).toBe('2026-12-02');
    expect(diffDays(t, '2026-11-27')).toBe(7);
    expect(startOfWeek(t)).toBe('2026-11-16');
    expect(relative('2026-11-21', t)).toBe('zítra');
    expect(relative('2026-11-18', t)).toBe('před 2 dny');
  });
  it('zpožděný a nadcházející obsah, follow-upy', () => {
    const d = createSeedData();
    const content = [
      { ...d.content[0], id: 'a', date: '2026-11-18', stage: 'prep' as const },
      { ...d.content[0], id: 'b', date: '2026-11-22', stage: 'scheduled' as const },
      { ...d.content[0], id: 'c', date: '2026-11-18', stage: 'published' as const },
    ];
    expect(overdueContent(content, t).map((c) => c.id)).toEqual(['a']);
    expect(upcomingContent(content, 7, t).map((c) => c.id)).toEqual(['b']);
    const contacts = [
      { ...d.contacts[0], id: 'x', nextDate: '2026-11-19', stage: 'osloveno' as const },
      { ...d.contacts[0], id: 'y', nextDate: '2026-11-30', stage: 'osloveno' as const },
      { ...d.contacts[0], id: 'z', nextDate: '2026-11-19', stage: 'hotovo' as const },
    ];
    expect(dueFollowUps(contacts, 3, t).map((c) => c.id)).toEqual(['x']);
    expect(attentionCount({ content, contacts }, t)).toEqual({ content: 1, contacts: 1 });
  });
});

describe('generátor', () => {
  it('doplní klub, zkratku a hashtagy', () => {
    const r = generateIdeas({ club: 'Sparta', clubHashtag: '#hcsparta', text: 'SPA', laceName: 'Červená', platform: 'ig-post', tone: 'product', price: 290, web: 'offsidestore.cz', claim: 'Nos svůj klub. Kdekoliv.', seed: 42 });
    expect(r.captions).toHaveLength(3);
    expect(r.captions.join(' ')).toContain('SPA');
    expect(r.captions.join(' ')).not.toMatch(/\{\w+\}/);
    expect(r.hashtags).toContain('#hcsparta');
  });
});

describe('heslo', () => {
  it('SHA-256 a ověření', async () => {
    const hex = Array.from(sha256Fallback(new TextEncoder().encode('offside2026')), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe(DEFAULT_PASSWORD_HASH);
    expect(await sha256Hex('offside2026')).toBe(DEFAULT_PASSWORD_HASH);
    expect(await verifyPassword('offside2026', null)).toBe(true);
    expect(await verifyPassword('Offside2026', null)).toBe(false);
  });
});
