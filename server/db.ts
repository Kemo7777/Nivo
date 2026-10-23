// ── AGENT-OWNED: business data-access ────────────────────────────────────────
// All raw SQL/ORM lives here so the tRPC procedures stay thin. This is a
// single-brand store: there is no per-user scoping on the catalog. Visitor
// writes (orders, messages, subscribers) are validated here; admin writes are
// gated in routers.ts by the Studio session.
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { atomic, db } from "./_core/db";
import { computeOrderTotal, normalizeQty } from "./pricing";
import { REFERENCE_PRODUCTS } from "./reference-data";
import {
  items,
  messages,
  orderItems,
  orders,
  products,
  siteSettings,
  subscribers,
} from "../drizzle/schema";

// ── Scaffold example table (kept so the template's example page still works) ──

export async function listItemsByOwner(ownerId: string) {
  return db.select().from(items).where(eq(items.ownerId, ownerId)).orderBy(desc(items.createdAt));
}

export async function createItem(input: {
  ownerId: string;
  title: string;
  notes?: string;
  coverUrl?: string;
}) {
  const [row] = await db
    .insert(items)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      notes: input.notes ?? null,
      coverUrl: input.coverUrl ?? null,
    })
    .returning();
  return row;
}

export async function deleteItem(id: string, ownerId: string) {
  await db.delete(items).where(and(eq(items.id, id), eq(items.ownerId, ownerId)));
  return { ok: true };
}

/** A visitor-facing problem with an order (empty cart, unknown piece). */
export class OrderError extends Error {}

// Re-exported so callers have one import site; the implementation is pure and
// lives in pricing.ts so it can be tested without a database.
export { computeOrderTotal, normalizeQty } from "./pricing";

export type ProductInput = {
  id?: string;
  name: string;
  slug?: string;
  collection: string;
  category: string;
  garmentType: string;
  price: number;
  compareAtPrice?: number | null;
  sizes: string;
  colors: string;
  tagline: string;
  description: string;
  material: string;
  imageUrl: string;
  galleryUrls: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  stock: number;
  sortOrder: number;
};

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function listProducts(
  opts: { category?: string; sort?: string; includeInactive?: boolean } = {},
) {
  const where = [];
  if (!opts.includeInactive) where.push(eq(products.active, true));
  if (opts.category && opts.category !== "all") where.push(eq(products.category, opts.category));

  const order =
    opts.sort === "price-asc"
      ? [asc(products.price)]
      : opts.sort === "newest"
        ? [desc(products.createdAt)]
        : [desc(products.featured), asc(products.sortOrder), asc(products.createdAt)];

  return db.select().from(products).where(and(...where)).orderBy(...order);
}

export async function listFeaturedProducts(limit = 4) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .orderBy(asc(products.sortOrder))
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return row ?? null;
}

export async function getProductById(id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `piece-${Date.now().toString(36)}`;
}

export async function saveProduct(input: ProductInput) {
  const values = {
    name: input.name,
    slug: input.slug?.trim() ? slugify(input.slug) : slugify(input.name),
    collection: input.collection,
    category: input.category,
    garmentType: input.garmentType,
    price: Math.max(0, Math.round(input.price)),
    compareAtPrice:
      input.compareAtPrice === null || input.compareAtPrice === undefined
        ? null
        : Math.max(0, Math.round(input.compareAtPrice)),
    sizes: input.sizes,
    colors: input.colors,
    tagline: input.tagline,
    description: input.description,
    material: input.material,
    imageUrl: input.imageUrl,
    galleryUrls: input.galleryUrls,
    featured: input.featured,
    isNew: input.isNew,
    active: input.active,
    stock: Math.max(0, Math.round(input.stock)),
    sortOrder: Math.round(input.sortOrder),
  };

  if (input.id) {
    const [row] = await db
      .update(products)
      .set(values)
      .where(eq(products.id, input.id))
      .returning();
    return row ?? null;
  }
  const [row] = await db.insert(products).values(values).returning();
  return row ?? null;
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  return { ok: true };
}

/**
 * «استعادة البيانات الأصلية» from the Studio: re-insert the reference
 * catalogue. Rows whose slug is already there are left untouched — restoring is
 * additive, so it never wipes a piece the owner added themselves.
 */
export async function restoreReferenceData() {
  const rows = REFERENCE_PRODUCTS.map((p) => ({ ...p }));
  const inserted = await db.insert(products).values(rows).onConflictDoNothing().returning();
  return { inserted: inserted.length, total: rows.length };
}

// ── Orders ───────────────────────────────────────────────────────────────────

async function nextOrderCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = `NVO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.code, code))
      .limit(1);
    if (!existing) return code;
  }
  return `NVO-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

/**
 * Create an order. The total is recomputed HERE from the stored product prices —
 * a client-supplied total is never trusted. Prices are snapshotted onto the line
 * items so the order stays readable after a piece is edited or removed.
 */
export async function createOrder(input: {
  customerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  items: { productId: string; qty: number; size: string }[];
}) {
  const wanted = input.items.filter((i) => i && i.productId);
  if (!wanted.length) throw new OrderError("السلة فاضية — ضيف قطعة الأول.");

  const ids = [...new Set(wanted.map((i) => i.productId))];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const lines = wanted.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new OrderError("قطعة في السلة مش موجودة خلاص — شيلها وجرّب تاني.");
    const qty = normalizeQty(i.qty);
    return {
      productId: p.id,
      nameSnapshot: p.name,
      priceSnapshot: p.price,
      qty,
      size: i.size ?? "",
    };
  });

  const total = computeOrderTotal(lines);
  const code = await nextOrderCode();
  const orderId = crypto.randomUUID();

  await atomic(
    (d) =>
      [
        d.insert(orders).values({
          id: orderId,
          code,
          customerName: input.customerName,
          phone: input.phone,
          email: input.email,
          city: input.city,
          address: input.address,
          note: input.note,
          total,
          status: "pending",
        }),
        ...lines.map((l) => d.insert(orderItems).values({ orderId, ...l })),
      ] as unknown as [BatchItem<"pg">, ...BatchItem<"pg">[]],
  );

  return { code, total };
}

export async function getOrderByCode(code: string) {
  const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function listOrders() {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));
  const byOrder = new Map<string, typeof items>();
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }
  return rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }));
}

export async function updateOrderStatus(id: string, status: string) {
  const [row] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  return row ?? null;
}

// ── Messages & subscribers ───────────────────────────────────────────────────

export async function createMessage(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
}) {
  const [row] = await db.insert(messages).values(input).returning();
  return row ?? null;
}

export async function listMessages() {
  return db.select().from(messages).orderBy(desc(messages.createdAt));
}

export async function setMessageHandled(id: string, handled: boolean) {
  const [row] = await db.update(messages).set({ handled }).where(eq(messages.id, id)).returning();
  return row ?? null;
}

export async function subscribe(email: string) {
  const [row] = await db
    .insert(subscribers)
    .values({ email: email.toLowerCase() })
    .onConflictDoNothing()
    .returning();
  // Zero rows means the address was already on the list — that is a success for
  // the visitor, not an error, so report it as already-subscribed.
  return { alreadySubscribed: !row };
}

export async function listSubscribers() {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

// ── Site settings ────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function saveSettings(values: Record<string, string>) {
  const entries = Object.entries(values);
  if (!entries.length) return { ok: true };
  await atomic(
    (d) =>
      entries.map(([key, value]) =>
        d
          .insert(siteSettings)
          .values({ key, value })
          .onConflictDoUpdate({ target: siteSettings.key, set: { value } }),
      ) as unknown as [BatchItem<"pg">, ...BatchItem<"pg">[]],
  );
  return { ok: true };
}

// ── Studio stats ─────────────────────────────────────────────────────────────

export async function adminStats() {
  const [revenue] = await db
    .select({ v: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
    .from(orders)
    .where(ne(orders.status, "cancelled"));
  const [pending] = await db
    .select({ v: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));
  const [orderCount] = await db.select({ v: sql<number>`count(*)::int` }).from(orders);
  const [productCount] = await db.select({ v: sql<number>`count(*)::int` }).from(products);
  const [women] = await db
    .select({ v: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.category, "women"));
  const [men] = await db
    .select({ v: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.category, "men"));
  const [knit] = await db
    .select({ v: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.category, "knitwear"));
  const [unread] = await db
    .select({ v: sql<number>`count(*)::int` })
    .from(messages)
    .where(eq(messages.handled, false));
  const [subs] = await db.select({ v: sql<number>`count(*)::int` }).from(subscribers);

  return {
    revenue: revenue?.v ?? 0,
    pendingOrders: pending?.v ?? 0,
    orderCount: orderCount?.v ?? 0,
    productCount: productCount?.v ?? 0,
    womenCount: women?.v ?? 0,
    menCount: men?.v ?? 0,
    knitwearCount: knit?.v ?? 0,
    unreadMessages: unread?.v ?? 0,
    subscriberCount: subs?.v ?? 0,
  };
}
