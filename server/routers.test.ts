import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { makeCaller } from "./_core/test-caller";

// routers.ts imports ./admin (which reads _core/env at module load → needs
// DATABASE_URL/JWT_SECRET) and ./db (a real driver). Both are mocked here; the
// business logic under test is the gate and the input validation, not the DB.
vi.mock("./admin", () => ({
  isAdmin: vi.fn(async () => false),
  passwordMatches: vi.fn(async (candidate: string) => candidate === "NIVO555"),
  setAdminSession: vi.fn(async () => {}),
  clearAdminSession: vi.fn(() => {}),
}));

// routers.ts also imports ./_core/auth, which reads env.jwtSecret at module load
// and would throw before any test runs. Mocked for the same reason the frozen
// _core/test-caller.test.ts mocks it.
vi.mock("./_core/auth", () => {
  class AuthError extends Error {}
  return {
    authProvider: () => ({ login: vi.fn(), logout: vi.fn(), getSession: vi.fn() }),
    registerLocalUser: vi.fn(),
    AuthError,
    EmailTakenError: class EmailTakenError extends AuthError {},
  };
});

vi.mock("./db", () => ({
  OrderError: class OrderError extends Error {},
  listProducts: vi.fn(async () => []),
  listFeaturedProducts: vi.fn(async () => []),
  getProductBySlug: vi.fn(async () => null),
  createOrder: vi.fn(async () => ({ code: "NVO-TEST", total: 100 })),
  getOrderByCode: vi.fn(async () => null),
  createMessage: vi.fn(async () => ({ id: "m1" })),
  subscribe: vi.fn(async () => ({ alreadySubscribed: false })),
  getSettings: vi.fn(async () => ({ brandLine: "هدوم تفضل هادية." })),
  adminStats: vi.fn(async () => ({ revenue: 0 })),
  listOrders: vi.fn(async () => []),
  updateOrderStatus: vi.fn(async () => null),
  listMessages: vi.fn(async () => []),
  setMessageHandled: vi.fn(async () => null),
  listSubscribers: vi.fn(async () => []),
  saveProduct: vi.fn(async () => null),
  deleteProduct: vi.fn(async () => ({ ok: true })),
  saveSettings: vi.fn(async () => ({ ok: true })),
  listItemsByOwner: vi.fn(async () => []),
  createItem: vi.fn(async () => null),
  deleteItem: vi.fn(async () => ({ ok: true })),
}));

const { isAdmin } = await import("./admin");
const { createOrder } = await import("./db");

const anonymous = { c: {} as never, db: {} as never, user: null };

describe("studio gate", () => {
  it("refuses a studio read without an admin session", async () => {
    vi.mocked(isAdmin).mockResolvedValueOnce(false);
    const caller = makeCaller(anonymous);

    const err = await caller.studio.stats().catch((e) => e);

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("UNAUTHORIZED");
  });

  it("allows a studio read once the admin session is valid", async () => {
    vi.mocked(isAdmin).mockResolvedValueOnce(true);
    const caller = makeCaller(anonymous);

    await expect(caller.studio.stats()).resolves.toEqual({ revenue: 0 });
  });

  it("rejects a wrong password at login", async () => {
    const caller = makeCaller(anonymous);

    const err = await caller.studio.login({ password: "nope" }).catch((e) => e);

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("UNAUTHORIZED");
  });

  it("accepts the store password and opens a session", async () => {
    const caller = makeCaller(anonymous);

    await expect(caller.studio.login({ password: "NIVO555" })).resolves.toEqual({ ok: true });
  });
});

describe("public catalog", () => {
  it("is readable without any session", async () => {
    const caller = makeCaller(anonymous);
    await expect(caller.catalog.list()).resolves.toEqual([]);
  });

  it("404s a slug that does not exist", async () => {
    const caller = makeCaller(anonymous);
    const err = await caller.catalog.bySlug({ slug: "nope" }).catch((e) => e);
    expect((err as TRPCError).code).toBe("NOT_FOUND");
  });
});

describe("orders.create", () => {
  it("refuses an empty cart before touching the database", async () => {
    const caller = makeCaller(anonymous);
    const err = await caller.orders
      .create({
        customerName: "منى",
        phone: "01000000000",
        email: "",
        city: "القاهرة",
        address: "١٢ شارع البستان",
        note: "",
        items: [],
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("passes a valid order through to the data layer", async () => {
    const caller = makeCaller(anonymous);
    const result = await caller.orders.create({
      customerName: "منى",
      phone: "01000000000",
      email: "",
      city: "القاهرة",
      address: "١٢ شارع البستان",
      note: "",
      items: [{ productId: "p1", qty: 1, size: "M" }],
    });

    expect(result).toEqual({ code: "NVO-TEST", total: 100 });
  });
});

describe("newsletter.subscribe", () => {
  it("accepts an address", async () => {
    const caller = makeCaller(anonymous);
    await expect(caller.newsletter.subscribe({ email: "a@b.com" })).resolves.toEqual({
      alreadySubscribed: false,
    });
  });
});
