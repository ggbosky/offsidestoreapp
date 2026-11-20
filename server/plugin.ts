import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Club } from '../src/types';
import type { IntegrationStatus, ShopifySummary } from '../src/lib/integrations';
import { parseGoogleTrendsRss, summarizeOrders } from '../src/lib/shopifyStats';
import { fetchOrders, fetchOrdersCount, fetchProducts, fetchRepeatCustomers, shopifyMode, ShopifyError, type ShopifyEnv } from './shopify';
import { findTrendIdeas, AiError, type TrendRequest } from './ai';
import { editImage, GeminiError } from './gemini';

/**
 * Lokální API pro Offsidestore Studio – běží uvnitř `npm run dev` / `npm start`.
 * Klíče čte jen ze serverového prostředí (.env), do prohlížeče se nikdy nedostanou.
 */
export function offsideApi(env: Record<string, string | undefined>): Plugin {
  const handler = createHandler(env);
  return {
    name: 'offside-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson<T>(req: IncomingMessage, limit = 1_000_000): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw Object.assign(new Error('Požadavek je příliš velký.'), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as T;
  } catch {
    throw Object.assign(new Error('Neplatný JSON.'), { status: 400 });
  }
}

export function createHandler(env: Record<string, string | undefined>): Connect.NextHandleFunction {
  const shop: ShopifyEnv = {
    store: env.SHOPIFY_STORE ?? '',
    clientId: env.SHOPIFY_CLIENT_ID,
    clientSecret: env.SHOPIFY_CLIENT_SECRET,
    adminToken: env.SHOPIFY_ADMIN_TOKEN,
    apiVersion: env.SHOPIFY_API_VERSION || '2026-07',
  };
  const claudeModel = env.CLAUDE_MODEL || 'claude-opus-5-5';
  const geminiModel = env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
  let trendsCache: { at: number; geo: string; data: unknown } | null = null;

  return async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();

    // Ochrana: jen z tohoto počítače a jen z vlastní stránky (ne z cizích webů).
    const host = req.headers.host ?? '';
    const origin = req.headers.origin;
    if (!LOCAL_HOST.test(host) || (origin && new URL(origin).host !== host) || req.headers['x-offside-studio'] !== '1') {
      return send(res, 403, { error: 'Přístup jen z lokální aplikace Offsidestore Studio.' });
    }

    try {
      if (url.pathname === '/api/status' && req.method === 'GET') {
        const status: IntegrationStatus = {
          shopify: { configured: !!shopifyMode(shop), store: shop.store || null, mode: shopifyMode(shop) },
          anthropic: { configured: !!env.ANTHROPIC_API_KEY, model: claudeModel },
          gemini: { configured: !!env.GEMINI_API_KEY, model: geminiModel },
        };
        return send(res, 200, status);
      }

      if (url.pathname === '/api/shopify/summary' && req.method === 'POST') {
        if (!shopifyMode(shop)) return send(res, 400, { error: 'Shopify není nastavený – doplň SHOPIFY_STORE a přístupové údaje do .env.' });
        const body = await readJson<{ days?: number; clubs: Club[] }>(req);
        const days = Math.min(60, Math.max(7, Number(body.days) || 30));
        const [orders, products, total, repeat] = await Promise.all([
          fetchOrders(shop, days),
          fetchProducts(shop).catch(() => []),
          fetchOrdersCount(shop),
          fetchRepeatCustomers(shop),
        ]);
        const warnings: string[] = [];
        if (repeat === null) warnings.push('Stálé zákazníky nešlo načíst (chybí read_customers nebo přístup k chráněným zákaznickým datům).');
        if (total === null) warnings.push('Celkový počet objednávek nešlo zjistit – milníky se nezobrazí.');
        const summary: ShopifySummary = {
          fetchedAt: new Date().toISOString(),
          ...summarizeOrders(orders, body.clubs ?? [], { days, totalOrdersAllTime: total }),
          products,
          repeatCustomers: repeat,
          warnings,
        };
        return send(res, 200, summary);
      }

      if (url.pathname === '/api/trends/google' && req.method === 'GET') {
        const geo = (url.searchParams.get('geo') || 'CZ').replace(/[^A-Z]/gi, '').slice(0, 2).toUpperCase();
        if (trendsCache && trendsCache.geo === geo && Date.now() - trendsCache.at < 20 * 60_000) return send(res, 200, trendsCache.data);
        const r = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`);
        if (!r.ok) return send(res, 502, { error: `Google Trends vrátil HTTP ${r.status}.` });
        const data = parseGoogleTrendsRss(await r.text());
        trendsCache = { at: Date.now(), geo, data };
        return send(res, 200, data);
      }

      if (url.pathname === '/api/ai/trends' && req.method === 'POST') {
        if (!env.ANTHROPIC_API_KEY) return send(res, 400, { error: 'Chybí ANTHROPIC_API_KEY v souboru .env.' });
        const body = await readJson<TrendRequest>(req);
        const result = await findTrendIdeas(env.ANTHROPIC_API_KEY, claudeModel, body);
        return send(res, 200, result);
      }

      if (url.pathname === '/api/ai/image' && req.method === 'POST') {
        if (!env.GEMINI_API_KEY) return send(res, 400, { error: 'Chybí GEMINI_API_KEY v souboru .env.' });
        const body = await readJson<{ prompt: string; image: string }>(req, 15_000_000);
        const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(body.image ?? '');
        if (!m || !body.prompt?.trim()) return send(res, 400, { error: 'Chybí fotka (PNG/JPG/WebP) nebo instrukce.' });
        const out = await editImage({ apiKey: env.GEMINI_API_KEY, model: geminiModel }, body.prompt, m[2], m[1]);
        return send(res, 200, { image: `data:${out.mimeType};base64,${out.imageBase64}`, text: out.text });
      }

      return send(res, 404, { error: 'Neznámý požadavek.' });
    } catch (e) {
      const err = e as Error & { status?: number };
      const status = e instanceof ShopifyError || e instanceof AiError || e instanceof GeminiError ? err.status : err.status ?? 500;
      if (status === 500) console.error('[offside-api]', e);
      return send(res, status ?? 500, { error: err.message || 'Neočekávaná chyba serveru.' });
    }
  };
}
