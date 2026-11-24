import { describe, expect, it } from 'vitest';
import { countChars, normalizeText, priceForText } from './pricing';
import { parseBackup, createBackup } from './backup';
import { sha256Fallback, sha256Hex, verifyPassword } from './auth';
import { addDays, diffDays, relative, startOfWeek } from './dates';
import { attentionCount, dueFollowUps, overdueContent, upcomingContent } from './selectors';
import { createSeedData, DEFAULT_SETTINGS, purgeDemo } from '../data/seed';
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
  it('nová aplikace začíná bez ukázkových kontaktů a obsahu', () => {
    const d = createSeedData();
    expect(d.contacts).toEqual([]);
    expect(d.content).toEqual([]);
    expect(d.bracelets.map((b) => b.id)).not.toContain('b-idea-derby');
    expect(d.bracelets).toHaveLength(12);
  });
  it('aktualizace smaže ukázky, ale vlastní záznamy nechá', () => {
    const demo = createSeedData({ demo: true });
    const mine = { ...demo.contacts[0], id: 'k-vlastni', name: 'Můj kontakt' };
    const myPost = { ...demo.content[0], id: 'c-vlastni', contactIds: ['k-1', 'k-vlastni'], braceletIds: ['b-idea-derby', 'b-lit'] };
    const out = purgeDemo({ contacts: [...demo.contacts, mine], content: [...demo.content, myPost], bracelets: demo.bracelets });
    expect(out.contacts.map((k) => k.id)).toEqual(['k-vlastni']);
    expect(out.content.map((c) => c.id)).toEqual(['c-vlastni']);
    expect(out.content[0]).toMatchObject({ contactIds: ['k-vlastni'], braceletIds: ['b-lit'] });
    expect(out.bracelets).toHaveLength(12);
  });
  it('12 klubů z webu se správnými zkratkami', () => {
    const d = createSeedData({ demo: true });
    expect(d.clubs.map((c) => c.abbr)).toEqual(['LIT', 'SPA', 'PCE', 'JIH', 'VSE', 'ZLN', 'KOM', 'TRE', 'SLB', 'SLA', 'KLA', 'TRI']);
  });
  it('záloha: export → import', () => {
    const d = createSeedData({ demo: true });
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
    const d = createSeedData({ demo: true });
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

describe('meme styl', () => {
  it('vrátí memy s doplněným klubem, krátkým popiskem a málo hashtagy', () => {
    for (let seed = 1; seed < 40; seed++) {
      const r = generateIdeas({ club: 'Kometa', clubHashtag: '#kometabrno', text: 'KOM', laceName: 'Modrá', platform: 'ig-post', tone: 'meme', price: 290, web: 'offsidestore.cz', claim: 'Nos svůj klub. Kdekoliv.', seed });
      expect(r.memes).toHaveLength(4);
      for (const m of r.memes) {
        expect(`${m.top} ${m.bottom} ${m.caption}`).not.toMatch(/\{\w+\}/);
        expect(m.caption.length).toBeLessThanOrEqual(90);
      }
      expect(r.hashtags.split(' ').length).toBeLessThanOrEqual(3);
    }
  });
});

describe('carousel šablony', () => {
  it('každá šablona dá 1–10 slidů bez prázdných míst v textu', async () => {
    const { TEMPLATES } = await import('../features/carousel/model');
    const club = createSeedData().clubs.find((c) => c.id === 'kom');
    for (const t of TEMPLATES) {
      for (const c of [club, undefined]) {
        const slides = t.build(c);
        expect(slides.length).toBeGreaterThanOrEqual(1);
        expect(slides.length).toBeLessThanOrEqual(10);
        for (const sl of slides) for (const f of [sl.kicker, sl.text, sl.text2]) expect(f).not.toMatch(/undefined|\{|\s{2,}|^\s|\s$/);
      }
    }
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
