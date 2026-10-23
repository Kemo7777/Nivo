// The cart lives in localStorage: it is a visitor's own scratch state, not
// something the store needs to know about until they check out. The order
// itself is created server-side, where the total is recomputed from the stored
// prices — so nothing here is trusted for money.
import { useCallback, useEffect, useState } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  qty: number;
};

const KEY = "nivo_cart_v1";
const EVENT = "nivo-cart-change";

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to the cart from any component. */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => read());

  useEffect(() => {
    const sync = () => setLines(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((line: CartLine) => {
    const current = read();
    const i = current.findIndex((l) => l.productId === line.productId && l.size === line.size);
    if (i >= 0) {
      current[i] = { ...current[i], qty: Math.min(20, current[i].qty + line.qty) };
    } else {
      current.push(line);
    }
    write(current);
  }, []);

  const setQty = useCallback((productId: string, size: string, qty: number) => {
    const next = read()
      .map((l) =>
        l.productId === productId && l.size === size
          ? { ...l, qty: Math.max(0, Math.min(20, qty)) }
          : l,
      )
      .filter((l) => l.qty > 0);
    write(next);
  }, []);

  const remove = useCallback((productId: string, size: string) => {
    write(read().filter((l) => !(l.productId === productId && l.size === size)));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);

  return { lines, add, setQty, remove, clear, count, subtotal };
}

/** Format a whole-pound amount the way the video does: ١٬٤٤٥ ج.م */
export function formatEGP(amount: number): string {
  return `${amount.toLocaleString("ar-EG")} ج.م`;
}
