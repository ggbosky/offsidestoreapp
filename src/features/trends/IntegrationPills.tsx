import { useIntegrations } from '../../store/integrations';

export function IntegrationPills() {
  const status = useIntegrations((s) => s.status);
  const items = [
    ['Claude', status?.anthropic.configured],
    ['Shopify', status?.shopify.configured],
    ['Gemini', status?.gemini.configured],
  ] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([name, ok]) => (
        <span key={name} className={`chip ${ok ? 'border-ok/40 text-ok' : 'border-line-2 text-faint'}`} title={ok ? 'Propojeno' : 'Nepropojeno – viz Nastavení → Propojení'}>
          <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-ok' : 'bg-faint'}`} /> {name}
        </span>
      ))}
    </div>
  );
}
