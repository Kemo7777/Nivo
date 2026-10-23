// ── AGENT-OWNED: tRPC API surface ────────────────────────────────────────────
// Thin procedures: validate with zod, call server/db.ts, map expected failures to
// TRPCErrors the user can act on. The Studio is gated by a single store password
// (server/admin.ts) rather than a user account, so `studioProcedure` checks the
// admin cookie instead of ctx.user.
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { authProvider, registerLocalUser, AuthError, EmailTakenError } from "./_core/auth";
import { storageCommit, storagePutUrl, StorageError } from "./_core/storage";
import { isAdmin, passwordMatches, setAdminSession, clearAdminSession } from "./admin";
import * as q from "./db";

/** Requires a valid Studio session (the store password cookie). */
const studioProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!(await isAdmin(ctx.c))) throw new TRPCError({ code: "UNAUTHORIZED", message: "لازم تدخل باسورد الاستوديو." });
  return next({ ctx });
});

const productInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  slug: z.string().optional(),
  collection: z.string().default("خريف / شتاء ٢٤"),
  category: z.enum(["women", "men", "knitwear"]),
  garmentType: z.string().default(""),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  sizes: z.string().default("S,M,L"),
  colors: z.string().default(""),
  tagline: z.string().default(""),
  description: z.string().default(""),
  material: z.string().default(""),
  imageUrl: z.string().default(""),
  galleryUrls: z.string().default(""),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  active: z.boolean().default(true),
  stock: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const catalogRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          sort: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => q.listProducts({ category: input?.category, sort: input?.sort })),

  featured: publicProcedure.query(() => q.listFeaturedProducts(4)),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const product = await q.getProductBySlug(input.slug);
      if (!product || !product.active) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القطعة دي مش موجودة." });
      }
      return product;
    }),
});

const ordersRouter = router({
  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(2, "اكتب اسمك"),
        phone: z.string().min(6, "اكتب رقم موبايل صحيح"),
        email: z.string().default(""),
        city: z.string().default(""),
        address: z.string().min(4, "اكتب العنوان"),
        note: z.string().default(""),
        items: z
          .array(
            z.object({
              productId: z.string().min(1),
              qty: z.number().int().min(1).max(20),
              size: z.string().default(""),
            }),
          )
          .min(1, "السلة فاضية"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await q.createOrder(input);
      } catch (e) {
        if (e instanceof q.OrderError) throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
        throw e;
      }
    }),

  byCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const found = await q.getOrderByCode(input.code.toUpperCase());
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "مفيش طلب بالكود ده." });
      return found;
    }),
});

const messagesRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "اكتب اسمك"),
        email: z.string().min(5, "اكتب بريد صحيح"),
        subject: z.string().default("استفسار عام"),
        body: z.string().min(5, "اكتب رسالتك").max(500, "الرسالة أطول من ٥٠٠ حرف"),
      }),
    )
    .mutation(({ input }) => q.createMessage(input)),
});

const newsletterRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().min(5, "اكتب بريد صحيح") }))
    .mutation(({ input }) => q.subscribe(input.email)),
});

const settingsRouter = router({
  public: publicProcedure.query(() => q.getSettings()),
});

const studioRouter = router({
  // The gate itself is public: it is how you GET a session.
  login: publicProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!(await passwordMatches(input.password))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "الباسورد غلط." });
      }
      await setAdminSession(ctx.c);
      return { ok: true };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminSession(ctx.c);
    return { ok: true };
  }),

  session: publicProcedure.query(async ({ ctx }) => ({ admin: await isAdmin(ctx.c) })),

  stats: studioProcedure.query(() => q.adminStats()),

  products: studioProcedure.query(() => q.listProducts({ includeInactive: true })),

  saveProduct: studioProcedure.input(productInput).mutation(({ input }) => q.saveProduct(input)),

  /** «استعادة البيانات الأصلية» — re-inserts the reference catalogue. */
  restoreReferenceData: studioProcedure.mutation(() => q.restoreReferenceData()),

  deleteProduct: studioProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => q.deleteProduct(input.id)),

  /**
   * A signed PUT URL for a Studio image upload. The Studio is password-gated
   * rather than user-scoped, so the key is randomised under `studio/` and the
   * upload is committed as an anonymous (owner-less) file — the storefront has
   * no customer accounts to own it.
   */
  uploadUrl: studioProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const ext = (input.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const key = `studio/${randomUUID()}.${ext || "jpg"}`;
      try {
        const signed = await storagePutUrl(key, input.contentType);
        return { ...signed, path: key };
      } catch (e) {
        if (e instanceof StorageError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "الرفع مش متاح دلوقتي." });
        }
        throw e;
      }
    }),

  commitUpload: studioProcedure
    .input(z.object({ path: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const row = await storageCommit(input.path);
        return { publicPath: `/app-storage/${row.key}` };
      } catch (e) {
        if (e instanceof StorageError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "الصورة مترفعتش كاملة، جرّب تاني." });
        }
        throw e;
      }
    }),

  orders: studioProcedure.query(() => q.listOrders()),

  setOrderStatus: studioProcedure
    .input(z.object({ id: z.string().min(1), status: z.enum(["pending", "packed", "shipped", "done", "cancelled"]) }))
    .mutation(({ input }) => q.updateOrderStatus(input.id, input.status)),

  messages: studioProcedure.query(() => q.listMessages()),

  setMessageHandled: studioProcedure
    .input(z.object({ id: z.string().min(1), handled: z.boolean() }))
    .mutation(({ input }) => q.setMessageHandled(input.id, input.handled)),

  subscribers: studioProcedure.query(() => q.listSubscribers()),

  settings: studioProcedure.query(() => q.getSettings()),

  saveSettings: studioProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(({ input }) => q.saveSettings(input)),
});

// ── Scaffold-provided routers ────────────────────────────────────────────────
// The store itself has no customer accounts (the Studio is password-gated), but
// the template's `_core/useAuth.tsx` and its example pages call these, so they
// stay wired rather than leaving dead imports behind.
const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  signup: publicProcedure
    .input(z.object({ email: z.email(), password: z.string().min(8), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await registerLocalUser(input.email, input.password, input.name);
        await authProvider().login(ctx.c, input.email, input.password);
        return user;
      } catch (e: unknown) {
        if (e instanceof EmailTakenError) throw new TRPCError({ code: "CONFLICT", message: e.message });
        throw e;
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await authProvider().login(ctx.c, input.email, input.password);
      } catch (e) {
        if (e instanceof AuthError) throw new TRPCError({ code: "UNAUTHORIZED", message: e.message });
        throw e;
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await authProvider().logout(ctx.c);
    return { ok: true };
  }),
});

const itemsRouter = router({
  list: protectedProcedure.query(({ ctx }) => q.listItemsByOwner(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), notes: z.string().optional(), coverUrl: z.string().optional() }))
    .mutation(({ ctx, input }) => q.createItem({ ownerId: ctx.user.id, ...input })),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) => q.deleteItem(input.id, ctx.user.id)),
});

export const appRouter = router({
  auth: authRouter,
  items: itemsRouter,
  catalog: catalogRouter,
  orders: ordersRouter,
  messages: messagesRouter,
  newsletter: newsletterRouter,
  settings: settingsRouter,
  studio: studioRouter,
});

export type AppRouter = typeof appRouter;
