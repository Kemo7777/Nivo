// Pure pricing helpers — no database, no _core imports, so they can be unit
// tested directly. The order total is ALWAYS computed from the stored product
// prices; a client-supplied total is never trusted.
export function computeOrderTotal(lines: { priceSnapshot: number; qty: number }[]): number {
  return lines.reduce((sum, l) => sum + l.priceSnapshot * l.qty, 0);
}

/** Clamp a requested quantity into the range the store accepts. */
export function normalizeQty(qty: number): number {
  return Math.max(1, Math.min(20, Math.floor(qty) || 1));
}
