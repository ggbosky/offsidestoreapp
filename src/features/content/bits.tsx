import type { ContentItem, Platform } from '../../types';
import { PILLARS, PLATFORMS, STAGE_DOT, CONTENT_STAGES } from '../../lib/meta';

export function PlatformTags({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {platforms.map((p) => (
        <span key={p} className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
          {PLATFORMS[p].short}
        </span>
      ))}
    </span>
  );
}

export function PillarTag({ pillar }: { pillar: ContentItem['pillar'] }) {
  const p = PILLARS[pillar];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
      {p.label}
    </span>
  );
}

export function StageTag({ stage }: { stage: ContentItem['stage'] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted">
      <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} />
      {CONTENT_STAGES.find((s) => s.id === stage)?.label}
    </span>
  );
}
