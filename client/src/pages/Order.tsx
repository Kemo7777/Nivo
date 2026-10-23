import { Link, useParams } from "wouter";
import { Layout, EmptyState } from "@/components/Layout";
import { trpc } from "@/_core/trpc";
import { formatEGP } from "@/lib/cart";

const STATUS_LABEL: Record<string, string> = {
  pending: "اتسجّل — بنجهّزه",
  packed: "اتجهّز",
  shipped: "في الطريق",
  done: "اتسلّم",
  cancelled: "اتلغى",
};

export default function Order() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const query = trpc.orders.byCode.useQuery({ code }, { enabled: Boolean(code) });

  if (query.isLoading) {
    return (
      <Layout>
        <div className="container-nivo py-24">
          <div className="h-8 w-48 animate-pulse bg-sand" />
          <div className="mt-6 h-40 animate-pulse bg-sand" />
        </div>
      </Layout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Layout>
        <div className="container-nivo py-24">
          <EmptyState
            title="مفيش طلب بالكود ده"
            body="اتأكد من الكود اللي وصلك بعد تأكيد الطلب، أو كلّمنا في الاستوديو."
            action={
              <Link
                to="/contact"
                className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
              >
                كلّم الاستوديو
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const { order, items } = query.data;

  return (
    <Layout>
      <div className="container-nivo py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">تم تأكيد الطلب</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] leading-tight text-ink">
            شكراً يا {order.customerName.split(" ")[0]}.
          </h1>
          <p className="mt-4 text-[15px] leading-loose text-muted-foreground">
            سجّلنا طلبك وهنكلّمك على {order.phone} لتأكيد التوصيل. احتفظ بالكود ده للمتابعة.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 border border-line bg-sand px-6 py-5">
            <div>
              <p className="eyebrow">كود الطلب</p>
              <p className="mt-1 font-display text-2xl tracking-wider text-ink" dir="ltr">
                {order.code}
              </p>
            </div>
            <span className="ms-auto border border-olive px-3 py-1.5 text-[12px] text-olive">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <ul className="mt-10 border-t border-line">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between border-b border-line py-4">
                <div>
                  <p className="text-[14px] text-ink">{it.nameSnapshot}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {it.size && `مقاس ${it.size} · `}
                    {it.qty.toLocaleString("ar-EG")} × {formatEGP(it.priceSnapshot)}
                  </p>
                </div>
                <p className="text-[14px] text-ink">
                  {formatEGP(it.priceSnapshot * it.qty)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-between text-[15px]">
            <span className="text-ink">الإجمالي</span>
            <span className="text-ink">{formatEGP(order.total)}</span>
          </div>

          <div className="mt-10 border border-line p-6">
            <p className="eyebrow">التوصيل</p>
            <p className="mt-3 text-[14px] leading-loose text-muted-foreground">
              {order.address}
              {order.city && `، ${order.city}`}
            </p>
            {order.note && (
              <p className="mt-3 text-[13px] text-muted-foreground">ملاحظتك: {order.note}</p>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/shop"
              className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
            >
              كمّل تسوق
            </Link>
            <Link
              to="/contact"
              className="border border-line px-7 py-3 text-[12px] tracking-[0.16em] text-ink transition-colors hover:border-ink/40"
            >
              عندك سؤال؟
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
