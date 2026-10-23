import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout, EmptyState } from "@/components/Layout";
import { trpc } from "@/_core/trpc";
import { formatEGP, useCart } from "@/lib/cart";

export default function Cart() {
  const { lines, setQty, remove, clear, subtotal } = useCart();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    note: "",
  });
  const [error, setError] = useState("");

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (res) => {
      clear();
      navigate(`/order/${res.code}`);
    },
    onError: (e) => setError(e.message),
  });

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="container-nivo py-20 md:py-28">
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-ink">السلة</h1>
          <div className="mt-10">
            <EmptyState
              title="السلة فاضية"
              body="لسه مضفتش حاجة. شوف المجموعة واختار القطعة اللي تعجبك."
              action={
                <Link
                  to="/shop"
                  className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
                >
                  تسوق الكولكشن
                </Link>
              }
            />
          </div>
        </div>
      </Layout>
    );
  }

  const shipping = subtotal >= 1000 ? 0 : 60;

  return (
    <Layout>
      <div className="container-nivo py-14 md:py-20">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-ink">السلة</h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          {lines.length.toLocaleString("ar-EG")} قطعة في السلة
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Line items */}
          <div>
            <ul className="border-t border-line">
              {lines.map((l) => (
                <li
                  key={`${l.productId}-${l.size}`}
                  className="flex gap-5 border-b border-line py-6"
                >
                  <Link to={`/product/${l.slug}`} className="img-zoom h-28 w-24 shrink-0 bg-sand">
                    {l.imageUrl ? (
                      <img src={l.imageUrl} alt={l.name} className="h-full w-full object-cover" />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/product/${l.slug}`}
                          className="text-[15px] text-ink transition-colors hover:text-olive"
                        >
                          {l.name}
                        </Link>
                        <p className="shrink-0 text-[14px] text-ink">
                          {formatEGP(l.price * l.qty)}
                        </p>
                      </div>
                      {l.size && (
                        <p className="mt-1 text-[12px] text-muted-foreground">المقاس: {l.size}</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          aria-label="أقل"
                          onClick={() => setQty(l.productId, l.size, l.qty - 1)}
                          className="px-3 py-1.5 text-ink transition-colors hover:bg-sand"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-[13px]">
                          {l.qty.toLocaleString("ar-EG")}
                        </span>
                        <button
                          type="button"
                          aria-label="أكتر"
                          onClick={() => setQty(l.productId, l.size, l.qty + 1)}
                          className="px-3 py-1.5 text-ink transition-colors hover:bg-sand"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.productId, l.size)}
                        className="text-[12px] text-muted-foreground transition-colors hover:text-destructive"
                      >
                        شيل
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between text-[13px]">
              <Link to="/shop" className="text-olive transition-opacity hover:opacity-70">
                ← كمّل تسوق
              </Link>
              <button
                type="button"
                onClick={clear}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                فضّي السلة
              </button>
            </div>
          </div>

          {/* Checkout */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-card p-6 md:p-7">
              <p className="eyebrow">ملخص الطلب</p>
              <dl className="mt-5 space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">المجموع</dt>
                  <dd className="text-ink">{formatEGP(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">الشحن</dt>
                  <dd className="text-ink">
                    {shipping === 0 ? "مجاني" : formatEGP(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-[15px]">
                  <dt className="text-ink">الإجمالي</dt>
                  <dd className="text-ink">{formatEGP(subtotal + shipping)}</dd>
                </div>
              </dl>

              <form
                className="mt-7 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  createOrder.mutate({
                    ...form,
                    items: lines.map((l) => ({
                      productId: l.productId,
                      qty: l.qty,
                      size: l.size,
                    })),
                  });
                }}
              >
                <p className="eyebrow">بيانات التوصيل</p>
                {[
                  { key: "customerName", label: "الاسم", required: true },
                  { key: "phone", label: "الموبايل", required: true },
                  { key: "email", label: "البريد الإلكتروني", required: false },
                  { key: "city", label: "المدينة", required: false },
                  { key: "address", label: "العنوان", required: true },
                ].map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-[12px] text-muted-foreground">{f.label}</span>
                    <input
                      required={f.required}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="mt-1.5 w-full border border-line bg-transparent px-3 py-2.5 text-[14px] text-ink focus:border-olive focus:outline-none"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">ملاحظة (اختياري)</span>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="mt-1.5 w-full resize-none border border-line bg-transparent px-3 py-2.5 text-[14px] text-ink focus:border-olive focus:outline-none"
                  />
                </label>

                {error && <p className="text-[12px] text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="w-full bg-olive py-3.5 text-[13px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark disabled:opacity-60"
                >
                  {createOrder.isPending ? "بنأكّد…" : "تأكيد الطلب"}
                </button>
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  الدفع كاش عند الاستلام. مش بنسحب أي بيانات بطاقة.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
