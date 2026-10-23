import "@/styles/studio.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link2,
  Lock,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Upload,
  X,
} from "lucide-react";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, GARMENT_TYPES } from "../../../server/reference-data";

/* ── Labels ───────────────────────────────────────────────────────────────── */

const CATEGORY_LABEL: Record<string, string> = {
  women: "نسائي",
  men: "رجالي",
  knitwear: "تريكو",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "جديد",
  packed: "متجهّز",
  shipped: "تم الشحن",
  done: "تم التوصيل",
  cancelled: "ملغي",
};

const STATUSES = ["pending", "packed", "shipped", "done", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

/** Whole pounds with Latin digits — the video's admin writes 1,445 ج.م. */
function egp(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} ج.م`;
}

const AR = (n: number) => n.toLocaleString("en-US");

/* ── Product row shape ────────────────────────────────────────────────────── */

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  collection: string;
  category: string;
  garmentType: string;
  price: number;
  compareAtPrice: number | null;
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

const EMPTY_PRODUCT: ProductRow = {
  id: "",
  name: "",
  slug: "",
  collection: "خريف / شتاء ٢٤",
  category: "women",
  garmentType: "بالطوهات",
  price: 0,
  compareAtPrice: null,
  sizes: "S,M,L",
  colors: "",
  tagline: "",
  description: "",
  material: "",
  imageUrl: "",
  galleryUrls: "",
  featured: false,
  isNew: true,
  active: true,
  stock: 10,
  sortOrder: 0,
};

/* ── Motion: metric count-up ──────────────────────────────────────────────── */

function useCountUp(target: number, duration = 850) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Metric({
  label,
  value,
  hint,
  suffix,
  delay,
}: {
  label: string;
  value: number;
  hint: string;
  suffix?: string;
  delay: number;
}) {
  const shown = useCountUp(value);
  return (
    <div className="st-metric" style={{ animationDelay: `${delay}ms` }}>
      <p className="st-metric__label">{label}</p>
      <p className="st-metric__value">
        {AR(shown)}
        {suffix && <span className="text-[13px] text-muted-foreground"> {suffix}</span>}
      </p>
      <p className="st-metric__hint">{hint}</p>
    </div>
  );
}

/* ── Root: gate then Studio ───────────────────────────────────────────────── */

export default function Admin() {
  const session = trpc.studio.session.useQuery();
  const utils = trpc.useUtils();

  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState("");

  const login = trpc.studio.login.useMutation({
    onSuccess: async () => {
      setError("");
      setPassword("");
      await utils.studio.session.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const logout = trpc.studio.logout.useMutation({
    onSuccess: async () => {
      await utils.studio.session.invalidate();
    },
  });

  if (session.isLoading) {
    return (
      <div className="st-login">
        <p className="text-[12px] tracking-[0.2em] text-cream/45">بنفتح الاستوديو…</p>
      </div>
    );
  }

  if (!session.data?.admin) {
    return (
      <div className="st-login">
        <div className="st-login__inner">
          <div className="st-login__mark">N</div>
          <p className="st-login__eyebrow">استوديو NIVO</p>
          <h1 className="st-login__title">دخول الاستوديو</h1>
          <p className="st-login__sub">
            سجّل دخولك لإدارة الكولكشن والأسعار والطلبات الجاية.
          </p>

          <form
            className="st-login__card"
            onSubmit={(e) => {
              e.preventDefault();
              if (!password.trim()) {
                setError("اكتب كلمة السر الأول.");
                return;
              }
              login.mutate({ password });
            }}
          >
            <label className="block">
              <span className="st-field__label">كلمة السر</span>
              <div className="st-secret">
                <input
                  type={reveal ? "text" : "password"}
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="اكتب كلمة سر الاستوديو"
                  className="st-input"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                  className="st-secret__toggle"
                >
                  {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {error && <p className="st-login__error">{error}</p>}

            <button
              type="submit"
              disabled={login.isPending}
              className="st-btn st-btn--ink st-btn--block mt-4"
            >
              {login.isPending ? "بندخّل…" : "افتح الاستوديو"}
            </button>
          </form>

          <Link to="/" className="st-login__back">
            ← رجوع للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return <Studio onLogout={() => logout.mutate()} />;
}

/* ── The dashboard ────────────────────────────────────────────────────────── */

type Tab = "products" | "orders" | "settings";

function Studio({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");
  const [toast, setToast] = useState("");

  const stats = trpc.studio.stats.useQuery();
  const products = trpc.studio.products.useQuery();
  const orders = trpc.studio.orders.useQuery();
  const settings = trpc.studio.settings.useQuery();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const utils = trpc.useUtils();
  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const saveProduct = trpc.studio.saveProduct.useMutation({
    onSuccess: async (_row, vars) => {
      setEditing(null);
      await utils.studio.products.invalidate();
      await utils.studio.stats.invalidate();
      flash(vars.id ? "اتحفظ التعديل ✓" : "اتضافت القطعة ✓");
    },
    onError: (e) => flash(e.message),
  });

  const deleteProduct = trpc.studio.deleteProduct.useMutation({
    onSuccess: async () => {
      await utils.studio.products.invalidate();
      await utils.studio.stats.invalidate();
      flash("اتشالت القطعة");
    },
    onError: (e) => flash(e.message),
  });

  const setOrderStatus = trpc.studio.setOrderStatus.useMutation({
    onSuccess: async () => {
      await utils.studio.orders.invalidate();
      await utils.studio.stats.invalidate();
      flash("اتغيّرت حالة الطلب ✓");
    },
    onError: (e) => flash(e.message),
  });

  const saveSettings = trpc.studio.saveSettings.useMutation({
    onSuccess: async () => {
      await utils.studio.settings.invalidate();
      await utils.settings.public.invalidate();
      flash("اتحفظت بيانات الموقع ✓");
    },
    onError: (e) => flash(e.message),
  });

  const restore = trpc.studio.restoreReferenceData.useMutation({
    onSuccess: async (res) => {
      await utils.studio.products.invalidate();
      await utils.studio.stats.invalidate();
      flash(
        res.inserted > 0
          ? `اترجعت ${res.inserted} قطعة من البيانات الأصلية`
          : "البيانات الأصلية موجودة بالفعل",
      );
    },
    onError: (e) => flash(e.message),
  });

  const rows = products.data ?? [];
  const s = stats.data;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.garmentType.toLowerCase().includes(term)
      );
    });
  }, [rows, category, search]);

  const visibleOrders = useMemo(() => {
    const all = orders.data ?? [];
    return status === "all" ? all : all.filter((o) => o.status === status);
  }, [orders.data, status]);

  return (
    <div className="st-page">
      <header className="st-head">
        <div className="container-nivo">
          <div className="st-head__row">
            <div className="st-head__id">
              <span className="st-head__mark">N</span>
              <div className="min-w-0">
                <p className="st-head__name">استوديو NIVO</p>
                <p className="st-head__meta">
                  {AR(s?.productCount ?? 0)} قطعة · {AR(s?.orderCount ?? 0)} طلب
                </p>
              </div>
            </div>

            <div className="st-head__actions">
              <div className="st-lang" role="group" aria-label="اللغة">
                <button type="button" className="st-lang__opt" data-active="true">
                  عربي
                </button>
                <button
                  type="button"
                  className="st-lang__opt"
                  data-active="false"
                  disabled
                  title="الموقع عربي بس حاليًا"
                >
                  EN
                </button>
              </div>
              <Link to="/" className="st-btn st-btn--ghost">
                <Store size={14} />
                افتح المتجر
              </Link>
              <button type="button" onClick={onLogout} className="st-btn st-btn--ghost">
                <Lock size={14} />
                تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-nivo pb-16">
        <div className="st-metrics">
          <Metric
            label="الإيرادات"
            value={s?.revenue ?? 0}
            suffix="ج.م"
            hint="كل الطلبات المؤكدة"
            delay={0}
          />
          <Metric
            label="طلبات جديدة"
            value={s?.pendingOrders ?? 0}
            hint="مستنية التغليف"
            delay={60}
          />
          <Metric
            label="ملابس نسائية"
            value={s?.womenCount ?? 0}
            hint="قطعة في القائمة"
            delay={120}
          />
          <Metric
            label="ملابس رجالية"
            value={s?.menCount ?? 0}
            hint="قطعة في القائمة"
            delay={180}
          />
        </div>

        <p className="st-notice">
          <span aria-hidden>ⓘ</span>
          <span>
            التعديلات بتتحفظ على السيرفر — افتح المتجر من أي جهاز وهتلاقي كل حاجة زي ما
            سبتها.
          </span>
        </p>

        <div className="st-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "products"}
            data-active={tab === "products"}
            className="st-tab"
            onClick={() => setTab("products")}
          >
            <Store size={13} />
            المنتجات <span className="st-tab__count">{AR(rows.length)}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "orders"}
            data-active={tab === "orders"}
            className="st-tab"
            onClick={() => setTab("orders")}
          >
            <ShoppingBag size={13} />
            الطلبات{" "}
            <span className="st-tab__count">{AR(orders.data?.length ?? 0)}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "settings"}
            data-active={tab === "settings"}
            className="st-tab"
            onClick={() => setTab("settings")}
          >
            <Settings size={13} />
            بيانات الموقع
          </button>
        </div>

        {tab === "products" && (
          <div className="st-panel">
            <div className="st-toolbar">
              <div className="st-chips">
                {[
                  { v: "all", l: "الكل" },
                  { v: "women", l: "نسائي" },
                  { v: "men", l: "رجالي" },
                  { v: "knitwear", l: "تريكو" },
                ].map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    data-active={category === c.v}
                    className="st-chip"
                    onClick={() => setCategory(c.v)}
                  >
                    {c.l}
                  </button>
                ))}
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <div className="st-search">
                  <Search size={14} className="st-search__icon" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث في القطع"
                    className="st-input"
                    aria-label="ابحث في القطع"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => restore.mutate()}
                  disabled={restore.isPending}
                  className="st-btn st-btn--ghost"
                >
                  استعادة البيانات الأصلية
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...EMPTY_PRODUCT })}
                  className="st-btn st-btn--primary"
                >
                  <Plus size={14} />
                  أضف قطعة
                </button>
              </div>
            </div>

            {products.isLoading && (
              <div className="st-tablewrap p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="st-skel st-skel--row" />
                ))}
              </div>
            )}

            {!products.isLoading && filtered.length === 0 && (
              <div className="st-empty">
                <p className="st-empty__title">مفيش قطع مطابقة</p>
                <p className="st-empty__body">
                  جرّب بحث تاني، أو غيّر الفلتر، أو ابدأ بإضافة قطعة جديدة للكولكشن.
                </p>
                <div className="st-empty__action">
                  {rows.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setEditing({ ...EMPTY_PRODUCT })}
                      className="st-btn st-btn--primary"
                    >
                      <Plus size={14} />
                      أضف قطعة
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCategory("all");
                      }}
                      className="st-btn st-btn--quiet"
                    >
                      إعادة ضبط الفلتر
                    </button>
                  )}
                </div>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="st-tablewrap">
                <div className="st-scroll">
                  <table className="st-table">
                    <thead>
                      <tr>
                        <th>القطعة</th>
                        <th>المجموعة</th>
                        <th>الفئة</th>
                        <th>السعر</th>
                        <th>المخزون</th>
                        <th className="text-end">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => {
                        const onSale =
                          p.compareAtPrice !== null && p.compareAtPrice > p.price;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="st-piece">
                                <div className="st-thumb">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt="" loading="lazy" />
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <p className="st-piece__name">{p.name}</p>
                                  <p className="st-piece__slug">{p.slug}</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {p.isNew && (
                                      <span className="st-badge st-badge--new">جديد</span>
                                    )}
                                    {!p.active && (
                                      <span className="st-badge st-badge--hidden">
                                        مخفي
                                      </span>
                                    )}
                                    {p.stock <= 0 && (
                                      <span className="st-badge st-badge--sold">نفدت</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-muted-foreground">
                              {CATEGORY_LABEL[p.category] ?? p.category}
                            </td>
                            <td className="text-muted-foreground">
                              {p.garmentType || "—"}
                            </td>
                            <td>
                              <span className="st-price">{egp(p.price)}</span>
                              {onSale && (
                                <span className="st-price__was">
                                  {egp(p.compareAtPrice!)}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={p.stock > 0 ? "" : "text-[#a33a2a]"}>
                                {AR(p.stock)}
                              </span>
                            </td>
                            <td>
                              <div className="st-rowactions">
                                <button
                                  type="button"
                                  className="st-link"
                                  onClick={() => setEditing(p as ProductRow)}
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  className="st-link st-link--muted"
                                  onClick={() => {
                                    if (confirm(`تشيل «${p.name}» من الكولكشن؟`)) {
                                      deleteProduct.mutate({ id: p.id });
                                    }
                                  }}
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="st-panel">
            <div className="st-chips">
              {(
                [
                  { v: "all", l: "الكل" },
                  ...STATUSES.map((st) => ({ v: st, l: STATUS_LABEL[st] })),
                ] as { v: "all" | Status; l: string }[]
              ).map((c) => (
                <button
                  key={c.v}
                  type="button"
                  data-active={status === c.v}
                  className="st-chip"
                  onClick={() => setStatus(c.v)}
                >
                  {c.l}
                </button>
              ))}
            </div>

            {orders.isLoading && (
              <div className="st-orders">
                {[0, 1].map((i) => (
                  <div key={i} className="st-skel" style={{ height: 96 }} />
                ))}
              </div>
            )}

            {!orders.isLoading && visibleOrders.length === 0 && (
              <div className="st-empty">
                <p className="st-empty__title">مفيش طلبات لسه</p>
                <p className="st-empty__body">
                  أي طلب يتم من المتجر بيظهر في القائمة دي فورًا، وإنت بتغيّر حالته من
                  هنا.
                </p>
                <div className="st-empty__action">
                  {status !== "all" ? (
                    <button
                      type="button"
                      onClick={() => setStatus("all")}
                      className="st-btn st-btn--quiet"
                    >
                      شوف كل الطلبات
                    </button>
                  ) : (
                    <Link to="/shop" className="st-btn st-btn--ghost">
                      افتح المتجر
                    </Link>
                  )}
                </div>
              </div>
            )}

            {visibleOrders.length > 0 && (
              <div className="st-orders">
                {visibleOrders.map((o) => (
                  <article key={o.id} className="st-order">
                    <div className="st-order__top">
                      <div className="min-w-0">
                        <div className="st-order__code">
                          <span>{o.code}</span>
                          <span className={`st-badge st-badge--${o.status}`}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </div>
                        <p className="st-order__who">{o.customerName}</p>
                        <p className="st-order__line" dir="ltr">
                          {o.phone}
                          {o.email ? ` · ${o.email}` : ""}
                        </p>
                        <p className="st-order__line">
                          {o.address}
                          {o.city ? `، ${o.city}` : ""}
                        </p>
                      </div>

                      <div className="st-order__side">
                        <p className="st-order__total">{egp(o.total)}</p>
                        <p className="st-order__date">
                          {new Date(o.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            setOrderStatus.mutate({
                              id: o.id,
                              status: e.target.value as Status,
                            })
                          }
                          className="st-select"
                          aria-label={`حالة الطلب ${o.code}`}
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {STATUS_LABEL[st]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="st-order__items">
                      {o.items.map((it) => (
                        <div key={it.id} className="st-order__item">
                          <span>
                            {it.nameSnapshot}
                            {it.size ? ` · ${it.size}` : ""} × {AR(it.qty)}
                          </span>
                          <span>{egp(it.priceSnapshot * it.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="st-panel">
            {settings.isLoading ? (
              <div className="st-section">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="st-skel st-skel--row" />
                ))}
              </div>
            ) : (
              <SettingsForm
                initial={settings.data ?? {}}
                saving={saveSettings.isPending}
                onSave={(values) => saveSettings.mutate(values)}
              />
            )}
          </div>
        )}
      </div>

      {editing && (
        <ProductDialog
          product={editing}
          saving={saveProduct.isPending}
          onClose={() => setEditing(null)}
          onSave={(p) => saveProduct.mutate(p as never)}
        />
      )}

      {toast && (
        <div className="st-toast">
          <span className="st-toast__inner">{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ── Site settings ────────────────────────────────────────────────────────── */

const SETTING_FIELDS: {
  key: string;
  label: string;
  placeholder?: string;
  full?: boolean;
  ltr?: boolean;
}[] = [
  { key: "phone", label: "رقم التليفون", placeholder: "+20 100 000 0000", ltr: true },
  { key: "phoneHours", label: "ملاحظة التليفون", placeholder: "Mon–Fri, 09:00–17:00" },
  { key: "email", label: "البريد الإلكتروني", placeholder: "studio@nivo.com", ltr: true },
  {
    key: "address",
    label: "عنوان الاستوديو",
    placeholder: "Værnedamsvej 5, 1819 Copenhagen",
  },
  { key: "addressNote", label: "ملاحظة العنوان" },
  { key: "productionHours", label: "مواعيد مكتب الإصلاح" },
  { key: "mapText", label: "بحث الخريطة (يستخدم في صفحة التواصل)", full: true },
  {
    key: "whatsapp",
    label: "واتساب (أرقام مع كود الدولة)",
    placeholder: "+201000000000",
    ltr: true,
  },
];

const SOCIALS: { key: string; label: string; placeholder: string }[] = [
  {
    key: "instagram",
    label: "INSTAGRAM",
    placeholder: "https://www.instagram.com/your-page",
  },
  {
    key: "facebook",
    label: "FACEBOOK",
    placeholder: "https://www.facebook.com/your-page",
  },
  { key: "tiktok", label: "TIKTOK", placeholder: "https://www.tiktok.com/@your-page" },
  {
    key: "pinterest",
    label: "PINTEREST",
    placeholder: "https://www.pinterest.com/your-page",
  },
];

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="st-section__head">
      <span className="st-section__icon">{icon}</span>
      <p className="st-section__title">{title}</p>
    </div>
  );
}

function SettingsForm({
  initial,
  saving,
  onSave,
}: {
  initial: Record<string, string>;
  saving: boolean;
  onSave: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload();

  const set = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
        setDirty(false);
      }}
    >
      <section className="st-section">
        <SectionHead icon={<ImageIcon size={14} />} title="اللوجو وسط البراند" />

        <div className="st-logo-row">
          <div className="st-logo">
            {values.logoUrl ? <img src={values.logoUrl} alt="اللوجو" /> : "N"}
          </div>
          <div className="st-logo-row__btns">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await upload.run(file);
                if (url) set("logoUrl", url);
              }}
            />
            <button
              type="button"
              disabled={upload.busy}
              onClick={() => fileRef.current?.click()}
              className="st-btn st-btn--ghost"
            >
              <Upload size={13} />
              {upload.busy ? "بنرفع…" : "ارفع اللوجو"}
            </button>
            <button
              type="button"
              onClick={() => set("logoUrl", "")}
              className="st-btn st-btn--ghost"
            >
              استخدم الأصلي
            </button>
          </div>
        </div>
        {upload.error && <p className="st-error">{upload.error}</p>}

        <div className="st-grid">
          <label className="st-grid__full block">
            <span className="st-field__label">أو الصق رابط صورة اللوجو</span>
            <input
              value={values.logoUrl ?? ""}
              onChange={(e) => set("logoUrl", e.target.value)}
              className="st-input st-input--ltr"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="st-field__label">سطر البراند في الفوتر</span>
            <input
              value={values.brandLine ?? ""}
              onChange={(e) => set("brandLine", e.target.value)}
              placeholder="جملة قصيرة عن البراند"
              className="st-input"
            />
          </label>
          <label className="block">
            <span className="st-field__label">جملة قصيرة عن البراند</span>
            <input
              value={values.tagline ?? ""}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="قصة قصيرة عن البراند"
              className="st-input"
            />
          </label>
        </div>
      </section>

      <section className="st-section">
        <SectionHead icon={<Store size={14} />} title="بيانات التواصل" />

        <div className="st-grid st-grid--3">
          {SETTING_FIELDS.map((f) => (
            <label key={f.key} className={cn("block", f.full && "st-grid__full")}>
              <span className="st-field__label">{f.label}</span>
              <input
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                dir={f.ltr ? "ltr" : undefined}
                className={cn("st-input", f.ltr && "st-input--ltr")}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="st-section">
        <SectionHead icon={<Link2 size={14} />} title="صفحات التواصل" />

        <div className="st-grid">
          {SOCIALS.map((soc) => (
            <div key={soc.key}>
              <label className="block">
                <span className="st-field__label">{soc.label}</span>
                <input
                  value={values[`${soc.key}Url`] ?? ""}
                  onChange={(e) => set(`${soc.key}Url`, e.target.value)}
                  placeholder={soc.placeholder}
                  dir="ltr"
                  className="st-input st-input--ltr"
                />
              </label>
              <label className="mt-3 block">
                <span className="st-field__label">اسم الحساب اللي يظهر في الموقع</span>
                <input
                  value={values[`${soc.key}Name`] ?? ""}
                  onChange={(e) => set(`${soc.key}Name`, e.target.value)}
                  placeholder="اسم الحساب اللي يظهر في الموقع"
                  className="st-input"
                />
              </label>
            </div>
          ))}
        </div>

        <p className="st-hint">
          سيب أي رابط فاضي عشان تخفي الصفحة من الفوتر وصفحة التواصل. البيانات دي بتظهر في
          الهيدر والفوتر وصفحة التواصل.
        </p>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || !dirty} className="st-btn st-btn--primary">
          {saving ? "بنحفظ…" : "احفظ البيانات"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValues(initial);
            setDirty(false);
          }}
          className="st-btn st-btn--ghost"
        >
          تراجع
        </button>
        {!dirty && !saving && <span className="st-saving">محفوظ ✓</span>}
      </div>
    </form>
  );
}

/* ── Image upload ─────────────────────────────────────────────────────────── */

/**
 * Uploads straight to platform storage through a Studio-scoped signed URL, then
 * commits the key so it has a row. Returns the `/app-storage/…` path the rest of
 * the app reads images from.
 */
function useImageUpload() {
  const sign = trpc.studio.uploadUrl.useMutation();
  const commit = trpc.studio.commitUpload.useMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (file: File): Promise<string | null> => {
    setBusy(true);
    setError("");
    try {
      const { uploadUrl, path } = await sign.mutateAsync({
        filename: file.name,
        contentType: file.type || "image/jpeg",
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "image/jpeg" },
        body: file,
      });
      if (!res.ok) throw new Error("الرفع فشل، جرّب تاني.");
      const { publicPath } = await commit.mutateAsync({ path });
      return publicPath;
    } catch (e) {
      setError(e instanceof Error ? e.message : "الرفع فشل، جرّب تاني.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, error };
}

/* ── Product dialog ───────────────────────────────────────────────────────── */

function ProductDialog({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: ProductRow;
  saving: boolean;
  onClose: () => void;
  onSave: (p: ProductRow) => void;
}) {
  const isNew = !product.id;
  const [form, setForm] = useState<ProductRow>(product);
  const [colors, setColors] = useState<string[]>(
    product.colors
      .split(/[،,]/)
      .map((c) => c.trim())
      .filter(Boolean),
  );
  const [gallery, setGallery] = useState<string[]>(
    product.galleryUrls
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean),
  );
  const [linkDraft, setLinkDraft] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload();

  const category = form.category as "women" | "men" | "knitwear";
  const garmentOptions = GARMENT_TYPES[category] ?? [];
  const compare = form.compareAtPrice ?? 0;
  const onSale = compare > form.price && compare > 0;

  // Escape closes the dialog — matches every other modal expectation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof ProductRow>(key: K, value: ProductRow[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.name.trim()) {
      setError("الاسم مطلوب.");
      return;
    }
    if (!Number.isFinite(form.price) || form.price <= 0) {
      setError("اكتب سعر أكبر من صفر.");
      return;
    }
    if (compare > 0 && compare <= form.price) {
      setError("السعر قبل الخصم لازم يكون أكبر من السعر الحالي.");
      return;
    }
    setError("");
    onSave({
      ...form,
      colors: colors.join("، "),
      imageUrl: gallery[0] ?? form.imageUrl,
      galleryUrls: gallery.join(","),
    });
  };

  return (
    <div
      className="st-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "أضف قطعة" : "تعديل قطعة"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="st-dialog"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="st-dialog__head">
          <div>
            <p className="st-dialog__eyebrow">{isNew ? "قطعة جديدة" : "تعديل"}</p>
            <h2 className="st-dialog__title">
              {isNew ? "أضف للكولكشن" : "عدّل القطعة"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="st-dialog__x"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>

        <div className="st-dialog__body">
          <label className="block">
            <span className="st-field__label">الاسم</span>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Atelier Wool Coat"
              className="st-input"
              autoFocus
            />
          </label>

          {/* ── The two price fields, side by side and impossible to miss ── */}
          <div className="st-pricepair mt-4">
            <label className="block">
              <span className="st-field__label">السعر (ج.م)</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={Number.isFinite(form.price) ? form.price : ""}
                onChange={(e) =>
                  set("price", e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="8500"
                className="st-input st-input--ltr"
                dir="ltr"
              />
            </label>

            <label className="block">
              <span className="st-field__label">السعر قبل الخصم (اختياري)</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  set(
                    "compareAtPrice",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                placeholder="9500"
                className="st-input st-input--ltr"
                dir="ltr"
              />
            </label>

            <p className="st-pricepair__preview">
              {onSale ? (
                <>
                  <span className="st-pricepair__now">{egp(form.price)}</span>
                  <span className="st-pricepair__was">{egp(compare)}</span>
                  <span>· خصم {Math.round((1 - form.price / compare) * 100)}٪</span>
                </>
              ) : (
                <>
                  <span className="st-pricepair__now">{egp(form.price)}</span>
                  <span>· من غير خصم</span>
                </>
              )}
            </p>

            <p className="st-pricepair__note">
              السعر ده هو اللي بيظهر في المتجر وصفحة المنتج وبيتحسب بيه إجمالي الطلب. سيب
              «السعر قبل الخصم» فاضي لو مفيش خصم — لو كتبته لازم يكون أكبر من السعر.
            </p>
          </div>

          <div className="st-grid mt-4">
            <label className="block">
              <span className="st-field__label">الفئة</span>
              <select
                value={form.garmentType}
                onChange={(e) => set("garmentType", e.target.value)}
                className="st-input"
              >
                {garmentOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                {form.garmentType && !garmentOptions.includes(form.garmentType) && (
                  <option value={form.garmentType}>{form.garmentType}</option>
                )}
              </select>
            </label>

            <label className="block">
              <span className="st-field__label">المجموعة</span>
              <select
                value={form.category}
                onChange={(e) => {
                  const next = e.target.value as "women" | "men" | "knitwear";
                  setForm((f) => ({
                    ...f,
                    category: next,
                    garmentType: GARMENT_TYPES[next][0],
                  }));
                }}
                className="st-input"
              >
                <option value="women">نسائي</option>
                <option value="men">رجالي</option>
                <option value="knitwear">تريكو</option>
              </select>
            </label>

            <label className="block">
              <span className="st-field__label">الموسم</span>
              <input
                value={form.collection}
                onChange={(e) => set("collection", e.target.value)}
                placeholder="خريف / شتاء ٢٤"
                className="st-input"
              />
            </label>

            <label className="block">
              <span className="st-field__label">المقاسات (مفصولة بفاصلة)</span>
              <input
                value={form.sizes}
                onChange={(e) => set("sizes", e.target.value)}
                placeholder="XS, S, M, L"
                dir="ltr"
                className="st-input st-input--ltr"
              />
            </label>
          </div>

          {/* ── Colours ── */}
          <div className="mt-4">
            <span className="st-field__label">الألوان</span>
            <div className="st-colors">
              {colors.map((c, i) => (
                <div key={`${c}-${i}`} className="st-colorrow">
                  <span
                    className="st-swatch"
                    style={{ background: COLOR_SWATCHES[c] ?? "#e8e4d9" }}
                  />
                  <input
                    value={c}
                    onChange={(e) => {
                      const next = [...colors];
                      next[i] = e.target.value;
                      setColors(next);
                    }}
                    className="st-input"
                    placeholder="اسم اللون"
                  />
                  <button
                    type="button"
                    onClick={() => setColors(colors.filter((_, j) => j !== i))}
                    className="st-dialog__x"
                    aria-label={`شيل اللون ${c}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setColors([...colors, ""])}
                className="st-btn st-btn--ghost self-start"
              >
                <Plus size={13} />
                أضف لون
              </button>
            </div>
          </div>

          {/* ── Images ── */}
          <div className="mt-4">
            <span className="st-field__label">الصور</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await upload.run(file);
                if (url) setGallery((g) => [...g, url]);
              }}
            />
            <div
              className="st-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
            >
              {gallery[0] ? (
                <div className="st-drop__preview">
                  <img src={gallery[0]} alt="" />
                </div>
              ) : (
                <Upload size={20} className="st-drop__icon" />
              )}
              <span className="st-drop__label">
                {upload.busy ? "بنرفع الصورة…" : "ارفع صورة"}
              </span>
            </div>
            {upload.error && <p className="st-error">{upload.error}</p>}

            {gallery.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {gallery.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative">
                    <div className="st-thumb">
                      <img src={src} alt="" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -end-1.5 grid h-5 w-5 place-items-center rounded-full bg-forest text-cream"
                      aria-label="شيل الصورة"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-end gap-2">
              <label className="block flex-1">
                <span className="st-field__label">أو الصق رابط صورة</span>
                <input
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="https://…"
                  dir="ltr"
                  className="st-input st-input--ltr"
                />
              </label>
              <button
                type="button"
                disabled={!linkDraft.trim()}
                onClick={() => {
                  setGallery([...gallery, linkDraft.trim()]);
                  setLinkDraft("");
                }}
                className="st-btn st-btn--ghost"
              >
                أضف الرابط
              </button>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="st-field__label">سطر قصير (يظهر في صفحة المنتج)</span>
            <input
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="القطعة اللي بتلبسها كل يوم."
              className="st-input"
            />
          </label>

          <label className="mt-4 block">
            <span className="st-field__label">الوصف</span>
            <textarea
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="st-input resize-none leading-loose"
            />
            <p className="st-char">{form.description.length}/500 حرف</p>
          </label>

          <label className="mt-2 block">
            <span className="st-field__label">الخامات والعناية (سطر لكل عنصر)</span>
            <textarea
              rows={3}
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
              placeholder="صوف ميرينو ٨٠٪ · بوليستر ٢٠٪"
              className="st-input resize-none leading-loose"
            />
          </label>

          <div className="st-grid mt-4">
            <label className="block">
              <span className="st-field__label">المخزون</span>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value) || 0)}
                className="st-input st-input--ltr"
                dir="ltr"
              />
            </label>
            <div className="flex flex-col justify-end gap-2.5 pb-1">
              <label className="st-check">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => set("isNew", e.target.checked)}
                />
                علّمه كموسم جديد
              </label>
              <label className="st-check">
                <input
                  type="checkbox"
                  checked={form.stock <= 0}
                  onChange={(e) => set("stock", e.target.checked ? 0 : 10)}
                />
                نفدت الكمية
              </label>
              <label className="st-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                />
                معروضة في المتجر
              </label>
            </div>
          </div>

          {error && <p className="st-error">{error}</p>}
        </div>

        <div className="st-dialog__foot">
          <button type="submit" disabled={saving} className="st-btn st-btn--primary">
            {saving ? "بنحفظ…" : isNew ? "أضف القطعة" : "احفظ التعديل"}
          </button>
          <button type="button" onClick={onClose} className="st-btn st-btn--ghost">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
