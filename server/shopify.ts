import type { ShopifyOrder, ShopifyProduct, ShopifyRepeatCustomer } from '../src/lib/integrations';

export interface ShopifyEnv {
  store: string;
  clientId?: string;
  clientSecret?: string;
  adminToken?: string;
  apiVersion: string;
}

/** „offsidestore“, „offsidestore.myshopify.com“ i celé URL → offsidestore.myshopify.com */
export function shopDomain(store: string): string {
  const s = store.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return s.endsWith('.myshopify.com') ? s : `${s}.myshopify.com`;
}

export function shopifyMode(env: Partial<ShopifyEnv>): 'admin_token' | 'client_credentials' | null {
  if (!env.store) return null;
  if (env.adminToken) return 'admin_token';
  if (env.clientId && env.clientSecret) return 'client_credentials';
  return null;
}

export class ShopifyError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

let cachedToken: { token: string; expiresAt: number; key: string } | null = null;

/** Token: buď trvalý (starší vlastní aplikace), nebo client credentials z Dev Dashboardu (platí 24 h). */
async function getToken(env: ShopifyEnv): Promise<string> {
  if (env.adminToken) return env.adminToken;
  const key = `${env.store}:${env.clientId}`;
  if (cachedToken && cachedToken.key === key && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const res = await fetch(`https://${shopDomain(env.store)}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.clientId!, client_secret: env.clientSecret! }),
  });
  if (!res.ok) {
    throw new ShopifyError(
      `Shopify odmítl vydat token (HTTP ${res.status}). Zkontroluj SHOPIFY_STORE, client ID/secret a že je aplikace z Dev Dashboardu nainstalovaná v obchodě.`,
      res.status === 400 || res.status === 401 ? 401 : 502,
    );
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000, key };
  return json.access_token;
}

interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

async function gql<T>(env: ShopifyEnv, query: string, variables: Record<string, unknown> = {}): Promise<GqlResponse<T>> {
  const res = await fetch(`https://${shopDomain(env.store)}/admin/api/${env.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await getToken(env) },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 || res.status === 403) {
    cachedToken = null;
    throw new ShopifyError('Shopify odmítl přístup (401/403). Zkontroluj token a oprávnění aplikace (read_orders, read_products).', 401);
  }
  if (!res.ok) throw new ShopifyError(`Shopify API vrátilo HTTP ${res.status}.`);
  return (await res.json()) as GqlResponse<T>;
}

const ORDERS = /* GraphQL */ `
  query Orders($q: String!, $after: String) {
    orders(first: 100, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        createdAt
        lineItems(first: 30) {
          nodes { title quantity sku variantTitle customAttributes { key value } product { handle } }
        }
      }
    }
  }
`;

interface OrdersData {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<{
      createdAt: string;
      lineItems: { nodes: Array<{ title: string; quantity: number; sku: string | null; variantTitle: string | null; customAttributes: Array<{ key: string; value: string | null }>; product: { handle: string } | null }> };
    }>;
  };
}

/** Objednávky za posledních N dní (bez osobních údajů). Bez oprávnění read_all_orders vrací Shopify max. 60 dní. */
export async function fetchOrders(env: ShopifyEnv, days: number, maxOrders = 1500): Promise<ShopifyOrder[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const out: ShopifyOrder[] = [];
  let after: string | null = null;
  do {
    const r: GqlResponse<OrdersData> = await gql<OrdersData>(env, ORDERS, { q: `created_at:>=${since} AND -status:cancelled`, after });
    if (!r.data) throw new ShopifyError(`Shopify: ${r.errors?.map((e) => e.message).join('; ') ?? 'neznámá chyba'}`);
    for (const o of r.data.orders.nodes) {
      out.push({
        createdAt: o.createdAt,
        lineItems: o.lineItems.nodes.map((li) => ({
          title: li.title,
          quantity: li.quantity,
          sku: li.sku,
          variantTitle: li.variantTitle,
          productHandle: li.product?.handle ?? null,
          attributes: li.customAttributes.filter((a) => a.value != null).map((a) => ({ key: a.key, value: a.value as string })),
        })),
      });
    }
    after = r.data.orders.pageInfo.hasNextPage ? r.data.orders.pageInfo.endCursor : null;
  } while (after && out.length < maxOrders);
  return out;
}

export async function fetchProducts(env: ShopifyEnv): Promise<ShopifyProduct[]> {
  const r = await gql<{ products: { nodes: Array<{ title: string; handle: string; status: string; onlineStoreUrl: string | null; featuredMedia: { preview: { image: { url: string } | null } | null } | null }> } }>(
    env,
    `{ products(first: 100, sortKey: TITLE) { nodes { title handle status onlineStoreUrl featuredMedia { preview { image { url } } } } } }`,
  );
  if (!r.data) throw new ShopifyError(`Shopify (produkty): ${r.errors?.map((e) => e.message).join('; ')}`);
  return r.data.products.nodes.map((p) => ({
    title: p.title,
    handle: p.handle,
    status: p.status,
    url: p.onlineStoreUrl,
    imageUrl: p.featuredMedia?.preview?.image?.url ?? null,
  }));
}

/** Celkový počet objednávek (pro milníky). Při chybě null. */
export async function fetchOrdersCount(env: ShopifyEnv): Promise<number | null> {
  try {
    const r = await gql<{ ordersCount: { count: number } }>(env, `{ ordersCount(limit: null) { count } }`);
    return r.data?.ordersCount?.count ?? null;
  } catch {
    return null;
  }
}

/**
 * Stálí zákazníci (2+ objednávky) – kandidáti na ambasadory do CRM.
 * Vyžaduje read_customers a přístup k chráněným zákaznickým datům; bez nich vrací null.
 */
export async function fetchRepeatCustomers(env: ShopifyEnv): Promise<ShopifyRepeatCustomer[] | null> {
  try {
    const r = await gql<{ customers: { nodes: Array<{ displayName: string; numberOfOrders: string | number; defaultEmailAddress: { emailAddress: string } | null; defaultAddress: { city: string | null } | null }> } }>(
      env,
      `{ customers(first: 50, query: "orders_count:>1", sortKey: UPDATED_AT, reverse: true) { nodes { displayName numberOfOrders defaultEmailAddress { emailAddress } defaultAddress { city } } } }`,
    );
    if (!r.data) return null;
    return r.data.customers.nodes.map((c) => ({
      name: c.displayName,
      email: c.defaultEmailAddress?.emailAddress ?? null,
      city: c.defaultAddress?.city ?? null,
      orders: Number(c.numberOfOrders) || 0,
    }));
  } catch {
    return null;
  }
}
