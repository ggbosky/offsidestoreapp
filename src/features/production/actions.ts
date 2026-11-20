import type { OrderStatus } from '../../types';
import { useData } from '../../store/data';
import { stockAlerts } from '../../lib/inventory';
import { STATUS_META } from '../../lib/orders';
import { toast } from '../../store/toast';

/** Změní stav objednávky a upozorní, pokud se tím nějaký materiál dostal pod limit. */
export function changeStatus(id: string, status: OrderStatus, opts: { silent?: boolean } = {}) {
  const store = useData.getState();
  const before = new Set(stockAlerts(store).map((a) => `${a.kind}:${a.id}`));
  store.setStatus(id, status);
  const after = stockAlerts(useData.getState());
  const fresh = after.filter((a) => !before.has(`${a.kind}:${a.id}`));
  const order = useData.getState().orders.find((o) => o.id === id);
  if (!opts.silent && order) toast(`${order.number}: ${STATUS_META[status].label}`, 'ok');
  if (fresh.length) {
    toast(`Sklad pod limitem: ${fresh.map((a) => `${a.label} (${a.current} ${a.unit})`).join(', ')}`, 'warn');
  }
}
