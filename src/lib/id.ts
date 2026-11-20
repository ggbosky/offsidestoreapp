export function uid(prefix = ''): string {
  const rnd = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${rnd}` : rnd;
}

export function orderNumber(seq: number, date = new Date()): string {
  return `OS-${date.getFullYear()}-${String(seq).padStart(4, '0')}`;
}
