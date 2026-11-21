import type { Club } from '../types';
import type { GoogleTrend, IntegrationStatus, ShopifySummary, TrendResearchResult } from './integrations';
import type { TrendRequestBody } from './trendRequest';

/** Volání lokálního serveru (běží s `npm run dev` / `npm start`). */
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', 'X-Offside-Studio': '1', ...(init.headers ?? {}) } });
  } catch {
    throw new Error('Lokální server neběží. Spusť aplikaci přes „npm run dev“ nebo „npm start“.');
  }
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) throw new Error('Lokální server neběží (aplikace je otevřená jako statická stránka). Spusť „npm run dev“.');
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Chyba ${res.status}`);
  return json;
}

export const api = {
  status: () => call<IntegrationStatus>('/api/status'),
  shopifySummary: (clubs: Club[], days = 30) => call<ShopifySummary>('/api/shopify/summary', { method: 'POST', body: JSON.stringify({ clubs, days }) }),
  googleTrends: (geo = 'CZ') => call<GoogleTrend[]>(`/api/trends/google?geo=${geo}`),
  findTrends: (body: TrendRequestBody) => call<TrendResearchResult>('/api/ai/trends', { method: 'POST', body: JSON.stringify(body) }),
  keys: () => call<{ editable: boolean; keys: Record<string, string> }>('/api/keys'),
  saveKeys: (values: Record<string, string>) => call<{ ok: true }>('/api/keys', { method: 'POST', body: JSON.stringify(values) }),
  editImage: (prompt: string, image: string) => call<{ image: string; text: string }>('/api/ai/image', { method: 'POST', body: JSON.stringify({ prompt, image }) }),
};
