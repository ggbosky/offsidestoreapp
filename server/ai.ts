import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { GoogleTrend, TrendResearchResult } from '../src/lib/integrations';

export interface TrendRequest {
  focus: string;
  today: string;
  clubs: Array<{ name: string; short: string; abbr: string; lace: string }>;
  shopify: string;
  googleTrends: GoogleTrend[];
  recentContent: string[];
  upcoming: string[];
}

export class AiError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

const BETAS = ['server-side-fallback-2026-07-01'];

const BRAND = `Offsidestore (offsidestore.cz) je malá česká značka ručně pletených náramků z originálních hokejových tkaniček z bruslí.
- Jedna tkanička v barvě klubu + stříbrná kovová písmena (zkratka klubu, např. LIT, SPA, KOM) nebo vlastní nápis. 3 znaky v ceně 290 Kč, každý další +12 Kč, max 12.
- Claim: „Nos svůj klub. Kdekoliv.“ Hlas značky: krátké úderné věty, hokejový slang, sebevědomě, s humorem, tykání. Fakta z webu: „Tkanička z brusle“, „Barva podle dresu“, „Zkratka v pletení, ne nalepená“, „Splétáno rukou“.
- Publikum: fanoušci české Tipsport extraligy a slovenské ligy, 15–40 let, IG a TikTok.
- Kluby v nabídce: {CLUBS}.`;

const RESEARCH_SYSTEM = `Jsi trendový zvěd pro sociální sítě české hokejové značky. Dnes je {TODAY}.
Pomocí webového vyhledávání zjisti, co je PRÁVĚ TEĎ (posledních ~7 dní, výhledově 14 dní) virální nebo hodně sdílené v Česku a na Slovensku a celosvětově na IG/TikToku:
1. meme formáty a šablony (např. typ „2013 vs. dnes“ srovnání, fotky z události, kterou si značky přepisují na vlastní promo, jako to dělá Jablkoňovna),
2. popkultura a velké události (hry, filmy, seriály, hudba, virální videa, viralní momenty se značkami),
3. hokej: Tipsport extraliga, slovenská liga, NHL a čeští hráči, reprezentace, derby, rekordy, přestupy, kontroverze,
4. svátky, akce a kalendářní příležitosti v příštích 14 dnech.
Hledej konkrétně, ověřuj aktuálnost (datum!), nepiš nic, co nemáš ze zdroje. Na konci napiš stručný přehled v češtině: pro každý trend 1–3 věty – co to je, proč to frčí, odkaz na zdroj a odhad, jak dlouho to vydrží.`;

const IDEAS_SYSTEM = `Jsi kreativní šéf sociálních sítí, který vymýšlí rychlé, drzé a vtipné trendjackingové příspěvky v duchu Jablkoňovny – ale pro hokejovou značku náramků.
${BRAND}

STYL (podle oblíbených příspěvků Jablkoňovny, např. „Gta 5 vs. Gta 6 léta. Ten čas tak letí 🥲🥹.“, „Je to tak, telefon si u nás dovolí fakt každý. Babička tak může zůstat v klidu. 😅“, „Mise splněna!🤣🫡“, „Těšíš se na Vánoce? 🎄“):
- Hlavní je OBRÁZEK = meme: fotka/screenshot s VELKÝM textem (imageText). Vtip musí fungovat i bez popisku.
- Situace, ve které se fanoušek pozná: rodina (babička, táta, přítelkyně), práce, peníze, zimák, rozhodčí, porážka, derby, „tehdy vs. teď“, svátky.
- Značka je v pointě nenápadně (náramek, tkanička z brusle, zkratka klubu, 290 Kč), ne jako reklama.
- caption = JEDNA krátká věta (max ~90 znaků) + 1–2 emoji. Žádné odrážky, žádné „kup teď“, odkaz na web jen výjimečně.
- hashtags = max 3 (#offsidestore + klub/hokej).

Pravidla:
- Každý nápad musí stát na KONKRÉTNÍM aktuálním trendu z přehledu (ne obecné „hokej je super“). Pointa musí být chytrá a srozumitelná za 2 vteřiny.
- Propoj trend s náramkem/tkaničkou/písmeny/klubem. Ideálně s jednoduchou realizací: telefon, fotka náramku, úprava fotky přes Gemini (Nano Banana), text přes šablonu.
- imagePrompt piš anglicky jako instrukci pro úpravu VLASTNÍ fotky náramku (Gemini image edit): co změnit, jaký styl, jaký text na obrázku (text na obrázku česky v uvozovkách).
- Bezpečnost značky: žádná cizí loga, ochranné známky ani herní/filmové assety ve vizuálu (jen styl/odkaz slovy), žádné tváře skutečných lidí bez svolení, žádné tragédie, politika ani zesměšňování konkrétních lidí; nenaznačuj oficiální spolupráci s klubem. U rizikovějších nápadů to otevřeně napiš do riskNote.
- imageText = text na obrázek česky, formát „NAHOŘE / DOLE“ (oddělit lomítkem), krátké a úderné.
- shelfLifeDays = jak dlouho má smysl to publikovat (memy 1–3 dny, události do data konání).
- clubs = zkratky klubů, kterých se nápad týká (může být prázdné).
- sourceUrls = URL z přehledu, ze kterých nápad vychází.
- Nevymýšlej to, co už je v seznamu nedávného obsahu.
Vrať 6–8 nápadů seřazených od nejlepšího.`;

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      trend: z.string(),
      whyNow: z.string(),
      sourceUrls: z.array(z.string()),
      format: z.enum(['meme', 'carousel', 'reel', 'story', 'tiktok', 'foto']),
      concept: z.string(),
      imageText: z.string(),
      hook: z.string(),
      caption: z.string(),
      hashtags: z.string(),
      imagePrompt: z.string(),
      shelfLifeDays: z.number().int(),
      risk: z.enum(['nizke', 'stredni', 'vysoke']),
      riskNote: z.string(),
      clubs: z.array(z.string()),
    }),
  ),
});

function clubsLine(r: TrendRequest) {
  return r.clubs.map((c) => `${c.name} (${c.abbr}, tkanička ${c.lace})`).join('; ');
}

function ensureNotRefused(msg: Anthropic.Beta.BetaMessage) {
  if (msg.stop_reason === 'refusal') {
    throw new AiError('Claude tuto žádost odmítl. Zkus jinak formulované zaměření.', 422);
  }
}

/** 1) Průzkum: Claude s webovým vyhledáváním najde, co teď frčí. */
async function research(client: Anthropic, model: string, r: TrendRequest) {
  const gt = r.googleTrends.slice(0, 15).map((t) => `${t.title} (${t.traffic})`).join(', ');
  const user = [
    r.focus ? `Na co se navíc zaměřit: ${r.focus}` : 'Bez speciálního zaměření – najdi to nejlepší.',
    gt ? `Google Trends CZ dnes: ${gt}` : '',
    r.upcoming.length ? `Naše blížící se příležitosti: ${r.upcoming.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: user }];
  const sources = new Map<string, string>();
  let text = '';

  for (let i = 0; i < 4; i++) {
    const stream = client.beta.messages.stream({
      model,
      max_tokens: 64000,
      betas: BETAS,
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: RESEARCH_SYSTEM.replace('{TODAY}', r.today),
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          max_uses: 8,
          user_location: { type: 'approximate', country: 'CZ', city: 'Praha', timezone: 'Europe/Prague' },
        },
      ],
      messages,
    });
    const msg = await stream.finalMessage();
    ensureNotRefused(msg);
    for (const block of msg.content) {
      if (block.type === 'text') {
        text += block.text;
        for (const c of block.citations ?? []) {
          if ('url' in c && c.url) sources.set(c.url, ('title' in c && c.title) || c.url);
        }
      } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const res of block.content) if (res.type === 'web_search_result') sources.set(res.url, res.title || res.url);
      }
    }
    if (msg.stop_reason !== 'pause_turn') break;
    // server-side smyčka se zastavila – pokračuj se stejnou historií
    messages.push({ role: 'assistant', content: msg.content });
  }

  if (!text.trim()) throw new AiError('Průzkum trendů nevrátil žádný text. Zkus to znovu.');
  return { brief: text.trim(), sources: [...sources.entries()].slice(0, 30).map(([url, title]) => ({ url, title })) };
}

/** 2) Nápady: z přehledu trendů + dat značky udělá konkrétní příspěvky (strukturovaný výstup). */
async function ideas(client: Anthropic, model: string, r: TrendRequest, brief: string) {
  const res = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(IdeasSchema) },
    system: IDEAS_SYSTEM.replace('{CLUBS}', clubsLine(r)),
    messages: [
      {
        role: 'user',
        content: [
          `Dnes je ${r.today}.`,
          `PŘEHLED AKTUÁLNÍCH TRENDŮ:\n${brief}`,
          `DATA ZE SHOPIFY (jen souhrn):\n${r.shopify}`,
          r.recentContent.length ? `NEDÁVNÝ / NAPLÁNOVANÝ OBSAH (neopakovat):\n- ${r.recentContent.join('\n- ')}` : '',
          r.focus ? `ZADÁNÍ: ${r.focus}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
  });
  ensureNotRefused(res);
  if (!res.parsed_output) throw new AiError('Nápady se nepodařilo zpracovat. Zkus to znovu.');
  return res.parsed_output.ideas;
}

export async function findTrendIdeas(apiKey: string, model: string, r: TrendRequest): Promise<TrendResearchResult> {
  const client = new Anthropic({ apiKey });
  try {
    const { brief, sources } = await research(client, model, r);
    const list = await ideas(client, model, r, brief);
    const titleOf = new Map(sources.map((s) => [s.url, s.title]));
    return {
      brief,
      sources,
      ideas: list.map(({ sourceUrls, ...i }) => ({
        ...i,
        shelfLifeDays: Math.min(30, Math.max(1, i.shelfLifeDays || 2)),
        sources: sourceUrls.filter((u) => /^https?:\/\//.test(u)).slice(0, 4).map((url) => ({ url, title: titleOf.get(url) ?? url })),
      })),
    };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError('Neplatný ANTHROPIC_API_KEY v souboru .env.', 401);
    if (e instanceof Anthropic.RateLimitError) throw new AiError('Claude API je přetížené nebo je vyčerpaný limit. Zkus to za chvíli.', 429);
    if (e instanceof Anthropic.BadRequestError) throw new AiError(`Claude API odmítlo požadavek: ${e.message}`, 400);
    if (e instanceof Anthropic.APIError) throw new AiError(`Chyba Claude API (${e.status ?? '?'}): ${e.message}`);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError('Nepodařilo se spojit s Claude API – jsi online?');
    throw e;
  }
}
