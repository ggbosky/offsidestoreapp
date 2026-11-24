import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { detectClub, nextMilestone, parseGoogleTrendsRss, risingClubs, summarizeOrders, summaryForPrompt } from './shopifyStats';
import { importRepeatCustomers, syncBraceletsFromProducts, tipsFromShopify } from './shopifySync';
import { createSeedData } from '../data/seed';
import { createHandler } from '../../server/plugin';
import { fetchOrders, shopDomain } from '../../server/shopify';
import { ideaToContent, isExpired } from '../features/trends/ideaToContent';
import type { ShopifyOrder, ShopifySummary, TrendIdea } from './integrations';

const clubs = createSeedData({ demo: true }).clubs;
const li = (title: string, quantity = 1, attributes: Array<{ key: string; value: string }> = [], handle: string | null = null) => ({ title, quantity, sku: null, variantTitle: null, productHandle: handle, attributes });

describe('Shopify statistiky', () => {
  const now = new Date('2026-11-20T12:00:00Z');
  const orders: ShopifyOrder[] = [
    { createdAt: '2026-10-25T10:00:00Z', lineItems: [li('Náramek HC KOMETA BRNO – KOM')] },
    { createdAt: '2026-11-15T10:00:00Z', lineItems: [li('Náramek HC KOMETA BRNO – KOM', 2), li('Příplatek za znak', 3, [], 'priplatek')] },
    { createdAt: '2026-11-18T10:00:00Z', lineItems: [li('Náramek HC KOMETA BRNO – KOM', 2)] },
    { createdAt: '2026-11-19T10:00:00Z', lineItems: [li('Konfigurační náramek', 1, [{ key: 'Zkratka', value: 'tata' }, { key: 'Barva', value: 'Červená' }], 'zakladni-konfiguracni-naramek')] },
    { createdAt: '2026-11-19T11:00:00Z', lineItems: [li('Konfigurační náramek', 1, [{ key: 'Písmena', value: 'TATA' }, { key: 'Klub', value: 'HC VERVA LITVÍNOV' }], 'zakladni-konfiguracni-naramek')] },
  ];
  const s = summarizeOrders(orders, clubs, { days: 30, now, totalOrdersAllTime: 488 });

  it('pozná klub podle zkratky, handle i atributu', () => {
    expect(detectClub(li('Náramek HC SPARTA PRAHA – SPA'), clubs)?.id).toBe('spa');
    expect(detectClub(li('Něco', 1, [], 'naramek-kometa-brno-kom'), clubs)?.id).toBe('kom');
    expect(detectClub(li('Konfigurátor', 1, [{ key: 'Klub', value: 'HC VERVA LITVÍNOV' }]), clubs)?.id).toBe('lit');
  });
  it('počítá kusy, přeskočí příplatky, najde opakované nápisy', () => {
    expect(s.bracelets).toBe(7);
    expect(s.orders).toBe(5);
    expect(s.customBracelets).toBe(2);
    expect(s.byClub[0]).toMatchObject({ clubId: 'kom', count: 5, firstHalf: 1, secondHalf: 4 });
    expect(s.repeatedTexts).toEqual([{ text: 'TATA', count: 2 }]);
    expect(s.nextMilestone).toBe(500);
  });
  it('rostoucí kluby a tipy', () => {
    expect(risingClubs(s)[0]).toMatchObject({ clubId: 'kom', growth: 300 });
    const full: ShopifySummary = { ...s, fetchedAt: '', products: [], repeatCustomers: null, warnings: [] };
    const tips = tipsFromShopify(full).map((t) => t.id);
    expect(tips).toEqual(expect.arrayContaining(['rise-KOM', 'milestone', 'text-TATA', 'weekday']));
  });
  it('souhrn pro AI neobsahuje osobní údaje', () => {
    const full: ShopifySummary = { ...s, fetchedAt: '', products: [], repeatCustomers: [{ name: 'Jan Novák', email: 'jan@example.cz', city: 'Brno', orders: 3 }], warnings: [] };
    const text = summaryForPrompt(full);
    expect(text).toContain('Kometa 5');
    expect(text).not.toContain('Novák');
    expect(text).not.toContain('@');
    expect(nextMilestone(1000)).toBe(1500);
  });
});

describe('Shopify synchronizace', () => {
  it('produkty doplní fotky ke klubovým náramkům', () => {
    const d = createSeedData({ demo: true });
    const r = syncBraceletsFromProducts(
      [
        { title: 'Náramek HC SPARTA PRAHA – SPA', handle: 'naramek-hc-sparta-praha-spa', status: 'ACTIVE', imageUrl: 'https://cdn.shopify.com/spa.jpg', url: null },
        { title: 'Základní konfigurační náramek', handle: 'zakladni-konfiguracni-naramek', status: 'ACTIVE', imageUrl: null, url: null },
      ],
      d.bracelets,
      d.clubs,
    );
    expect(r).toMatchObject({ updated: 1, added: 0 });
    expect(r.bracelets.find((b) => b.id === 'b-spa')?.photo).toBe('https://cdn.shopify.com/spa.jpg');
  });
  it('stálí zákazníci bez duplicit', () => {
    const d = createSeedData({ demo: true });
    const out = importRepeatCustomers(
      [
        { name: 'Info', email: 'info@example.cz', city: null, orders: 2 },
        { name: 'Pavla', email: 'pavla@example.cz', city: 'Zlín', orders: 4 },
      ],
      d.contacts,
    );
    expect(out.map((c) => c.name)).toEqual(['Pavla']);
    expect(out[0]).toMatchObject({ kind: 'ambasador', stage: 'tip' });
  });
});

describe('Google Trends', () => {
  it('parsuje RSS', () => {
    const items = parseGoogleTrendsRss(readFileSync(new URL('./__fixtures__/google-trends-cz.xml', import.meta.url), 'utf8'));
    expect(items.length).toBeGreaterThan(5);
    expect(items[0].title.length).toBeGreaterThan(0);
    expect(items[0].traffic).toMatch(/\d/);
  });
});

describe('trendové nápady', () => {
  const idea: TrendIdea = {
    id: 't1', createdAt: new Date().toISOString(), status: 'novy', trend: '2013 vs 2026', whyNow: 'Frčí to', sources: [{ title: 'x', url: 'https://example.com' }],
    format: 'meme', concept: 'Fanoušek 2013 vs 2026', hook: 'Tehdy vs teď', caption: 'Text', hashtags: '#offsidestore', imagePrompt: 'Make it retro', shelfLifeDays: 2, risk: 'stredni', riskNote: 'Bez log', clubs: ['KOM'],
  };
  it('převod do plánu', () => {
    const c = ideaToContent(idea, ['b-kom']);
    expect(c).toMatchObject({ stage: 'prep', platforms: ['ig-post', 'ig-story'], braceletIds: ['b-kom'], hook: 'Tehdy vs teď' });
    expect(c.notes).toContain('https://example.com');
    expect(c.notes).toContain('Riziko');
  });
  it('expirace', () => {
    expect(isExpired(idea)).toBe(false);
    expect(isExpired({ ...idea, createdAt: '2026-01-01T00:00:00Z' })).toBe(true);
  });
});

// ───────── Lokální API ─────────

function fakeReq(method: string, url: string, headers: Record<string, string>, body?: unknown): IncomingMessage {
  const r = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []) as unknown as IncomingMessage;
  Object.assign(r, { method, url, headers });
  return r;
}
function call(handler: ReturnType<typeof createHandler>, req: IncomingMessage) {
  return new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    const res = {
      statusCode: 200,
      setHeader() {},
      end(s: string) {
        resolve({ status: res.statusCode, body: JSON.parse(s) });
      },
    };
    handler(req, res as unknown as ServerResponse, () => resolve({ status: 0, body: {} }));
  });
}
const OK = { host: 'localhost:5173', 'x-offside-studio': '1' };

describe('lokální API – zabezpečení a stav', () => {
  const handler = createHandler({ ANTHROPIC_API_KEY: 'sk-test', SHOPIFY_STORE: 'offsidestore', SHOPIFY_CLIENT_ID: 'id', SHOPIFY_CLIENT_SECRET: 'secret' });
  it('odmítne cizí web, cizí host i požadavek bez hlavičky', async () => {
    expect((await call(handler, fakeReq('GET', '/api/status', { ...OK, origin: 'https://evil.example' }))).status).toBe(403);
    expect((await call(handler, fakeReq('GET', '/api/status', { ...OK, host: 'evil.example' }))).status).toBe(403);
    expect((await call(handler, fakeReq('GET', '/api/status', { host: 'localhost:5173' }))).status).toBe(403);
  });
  it('stav neprozradí klíče', async () => {
    const r = await call(handler, fakeReq('GET', '/api/status', OK));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ anthropic: { configured: true }, shopify: { configured: true, mode: 'client_credentials' }, gemini: { configured: false } });
    expect(JSON.stringify(r.body)).not.toContain('sk-test');
    expect(JSON.stringify(r.body)).not.toContain('secret');
  });
  it('bez klíčů vrátí srozumitelnou chybu', async () => {
    const empty = createHandler({});
    const r = await call(empty, fakeReq('POST', '/api/ai/trends', { ...OK, origin: 'http://localhost:5173' }, {}));
    expect(r.status).toBe(400);
    expect(String(r.body.error)).toContain('ANTHROPIC_API_KEY');
    const g = await call(empty, fakeReq('POST', '/api/ai/image', OK, { prompt: 'x', image: 'data:image/png;base64,AAA' }));
    expect(String(g.body.error)).toContain('GEMINI_API_KEY');
  });
  it('ne-API cesty pustí dál', async () => {
    expect((await call(handler, fakeReq('GET', '/index.html', OK))).status).toBe(0);
  });
});

describe('Shopify klient (simulované API)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('získá token přes client credentials a stránkuje objednávky', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push(url);
      if (url.endsWith('/admin/oauth/access_token')) {
        expect(String(init.body)).toContain('grant_type=client_credentials');
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 86399, scope: 'read_orders' }));
      }
      expect((init.headers as Record<string, string>)['X-Shopify-Access-Token']).toBe('tok');
      const vars = JSON.parse(String(init.body)).variables;
      const page = vars.after ? 2 : 1;
      return new Response(
        JSON.stringify({
          data: {
            orders: {
              pageInfo: { hasNextPage: page === 1, endCursor: page === 1 ? 'c1' : null },
              nodes: [{ createdAt: '2026-11-10T10:00:00Z', lineItems: { nodes: [{ title: 'Náramek – LIT', quantity: 1, sku: null, variantTitle: null, customAttributes: [{ key: 'x', value: null }], product: { handle: 'naramek-lit' } }] } }],
            },
          },
        }),
      );
    });
    const orders = await fetchOrders({ store: 'offsidestore', clientId: 'id', clientSecret: 's', apiVersion: '2026-07' }, 30);
    expect(orders).toHaveLength(2);
    expect(orders[0].lineItems[0].attributes).toEqual([]);
    expect(calls.filter((u) => u.includes('access_token'))).toHaveLength(1);
    expect(calls[1]).toBe('https://offsidestore.myshopify.com/admin/api/2026-07/graphql.json');
    expect(shopDomain('https://offsidestore.myshopify.com/admin')).toBe('offsidestore.myshopify.com');
  });
});

describe('klíče v desktopové aplikaci', () => {
  it('maskuje tajné klíče a ukládá jen povolené hodnoty', async () => {
    const env: Record<string, string | undefined> = { ANTHROPIC_API_KEY: 'sk-ant-1234567890abcd', SHOPIFY_STORE: 'offsidestore' };
    let saved: Record<string, string> | null = null;
    const h = createHandler(env, {
      saveKeys: (v) => {
        saved = v as Record<string, string>;
        Object.assign(env, v);
      },
    });
    const r = await call(h, fakeReq('GET', '/api/keys', OK));
    expect(r.body.editable).toBe(true);
    expect((r.body.keys as Record<string, string>).ANTHROPIC_API_KEY).toBe('sk-a…abcd');
    expect((r.body.keys as Record<string, string>).SHOPIFY_STORE).toBe('offsidestore');
    expect(JSON.stringify(r.body)).not.toContain('1234567890');

    await call(h, fakeReq('POST', '/api/keys', OK, { GEMINI_API_KEY: ' AIzaXYZ ', EVIL: 'x', PATH: '/tmp' }));
    expect(saved).toEqual({ GEMINI_API_KEY: 'AIzaXYZ' });
    const st = await call(h, fakeReq('GET', '/api/status', OK));
    expect(st.body).toMatchObject({ gemini: { configured: true } });
  });
  it('ve vývojové verzi klíče měnit nejde', async () => {
    const r = await call(createHandler({}), fakeReq('POST', '/api/keys', OK, { ANTHROPIC_API_KEY: 'x' }));
    expect(r.status).toBe(400);
  });
});
