import { create } from 'zustand';
import { api } from '../../lib/api';
import { buildTrendRequest } from '../../lib/trendRequest';
import { uid } from '../../lib/id';
import { useData } from '../../store/data';
import { useIntegrations } from '../../store/integrations';
import { toast } from '../../store/toast';
import type { TrendIdea } from '../../lib/integrations';

interface SearchState {
  busy: boolean;
  startedAt: number;
  error: string | null;
}

export const useTrendSearch = create<SearchState>(() => ({ busy: false, startedAt: 0, error: null }));

/** Spustí průzkum trendů (Claude + web) a uloží nápady. Bezpečné volat opakovaně – běží jen jednou. */
export async function runTrendSearch(focus: string, opts: { silent?: boolean } = {}) {
  if (useTrendSearch.getState().busy) return;
  useTrendSearch.setState({ busy: true, startedAt: Date.now(), error: null });
  try {
    await useIntegrations.getState().loadGoogle();
    const data = useData.getState();
    const res = await api.findTrends(buildTrendRequest(data, focus, useIntegrations.getState().google));
    const now = new Date().toISOString();
    const ideas: TrendIdea[] = res.ideas.map((i) => ({ ...i, id: uid('t'), createdAt: now, status: 'novy' }));
    useData.getState().addTrendResults({ text: res.brief, sources: res.sources, at: now, focus }, ideas);
    toast(`Nalezeno ${ideas.length} trendových nápadů.`);
  } catch (e) {
    const msg = (e as Error).message;
    useTrendSearch.setState({ error: msg });
    if (!opts.silent) toast(msg, 'error');
  } finally {
    useTrendSearch.setState({ busy: false });
  }
}
