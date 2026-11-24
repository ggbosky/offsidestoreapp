import type { ContentItem, ContentPillar, Platform } from '../../types';
import type { TrendFormat, TrendIdea } from '../../lib/integrations';
import { newContent } from '../../store/data';
import { today } from '../../lib/dates';
import { uid } from '../../lib/id';

const PLATFORMS: Record<TrendFormat, Platform[]> = {
  meme: ['ig-post', 'ig-story'],
  carousel: ['ig-post'],
  reel: ['ig-reel', 'tiktok'],
  story: ['ig-story'],
  tiktok: ['tiktok', 'ig-reel'],
  foto: ['ig-post'],
};

/** Z trendového nápadu udělá položku v plánu obsahu (s datem dnes – trendy nečekají). */
export function ideaToContent(i: TrendIdea, braceletIds: string[]): ContentItem {
  const pillar: ContentPillar = /hokej|zápas|derby|extralig|nhl|play/i.test(i.trend + i.concept) ? 'zapas' : 'fanousci';
  return newContent({
    title: `🔥 ${i.trend}`,
    stage: 'prep',
    pillar,
    platforms: PLATFORMS[i.format],
    date: today(),
    braceletIds,
    hook: i.hook,
    caption: i.caption,
    hashtags: i.hashtags,
    shots: [
      ...(i.imageText ? [{ id: uid('s'), text: `Text na obrázku: ${i.imageText}`, done: false }] : []),
      { id: uid('s'), text: `Vizuál: ${i.concept}`, done: false },
      ...(i.imagePrompt ? [{ id: uid('s'), text: `Gemini úprava fotky: ${i.imagePrompt}`, done: false }] : []),
    ],
    notes: [
      `Trend: ${i.trend}`,
      `Proč teď: ${i.whyNow}`,
      `Vydrží cca ${i.shelfLifeDays} dní – publikovat co nejdřív.`,
      i.risk !== 'nizke' ? `Riziko (${i.risk}): ${i.riskNote}` : '',
      ...i.sources.map((s) => `Zdroj: ${s.url}`),
    ]
      .filter(Boolean)
      .join('\n'),
  });
}

export function isExpired(i: TrendIdea, now = Date.now()) {
  return now > Date.parse(i.createdAt) + i.shelfLifeDays * 86_400_000;
}
