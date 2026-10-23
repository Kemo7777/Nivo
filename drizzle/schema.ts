import { pgTable, uuid, text, timestamp, index, bigint, integer, boolean } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM TABLE — managed by the scaffold. The Agent MUST NOT redefine or drop
// the auth columns here; it only ADDS business tables below.
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for SSO-linked users (future)
  name: text("name"),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// SYSTEM TABLE — managed by the scaffold, written by server/_core/storage.ts.
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    contentType: text("content_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("files_owner_idx").on(t.ownerId), index("files_created_idx").on(t.createdAt)],
);

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS TABLES — NIVO store
// ─────────────────────────────────────────────────────────────────────────────

// One garment in the collection.
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    collection: text("collection").notNull().default("خريف / شتاء ٢٤"),
    category: text("category").notNull().default("women"), // women | men | knitwear
    // The video's form splits the garment's *kind* (الفئة: بالطوهات، بلوفرات…)
    // from its *group* (المجموعة: نسائي / رجالي / تريكو). `category` is the
    // group the shop filters on; `garmentType` is what the admin table calls
    // الفئة and what the product page prints above the title.
    garmentType: text("garment_type").notNull().default(""),
    price: integer("price").notNull().default(0),
    compareAtPrice: integer("compare_at_price"),
    sizes: text("sizes").notNull().default("S,M,L"),
    colors: text("colors").notNull().default(""),
    // «سطر قصير (يظهر في صفحة المنتج)» from the form — a one-line hook.
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    material: text("material").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    galleryUrls: text("gallery_urls").notNull().default(""),
    featured: boolean("featured").notNull().default(false),
    // «علّمه كموسم جديد» — drives the «جديد» badge on cards and the product page.
    isNew: boolean("is_new").notNull().default(false),
    active: boolean("active").notNull().default(true),
    stock: integer("stock").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.category),
    index("products_active_idx").on(t.active),
    index("products_sort_idx").on(t.sortOrder),
  ],
);

// A placed order (cash on delivery — no payment gateway).
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    note: text("note").notNull().default(""),
    total: integer("total").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending|packed|shipped|done|cancelled
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt)],
);

// Line items of an order. Snapshots keep the order readable after a product changes.
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    nameSnapshot: text("name_snapshot").notNull(),
    priceSnapshot: integer("price_snapshot").notNull().default(0),
    qty: integer("qty").notNull().default(1),
    size: text("size").notNull().default(""),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// Contact-form messages, read in the Studio.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull().default(""),
    body: text("body").notNull(),
    handled: boolean("handled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_created_idx").on(t.createdAt)],
);

// Newsletter subscribers.
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Single-row-shaped key/value store for the site's own editable content.
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

// Scaffold example table. The store does not use it, but the template's example
// page and its `_core` auth wiring reference it, so it stays rather than leaving
// dead imports behind.
export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    coverUrl: text("cover_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("items_owner_idx").on(t.ownerId)],
);
