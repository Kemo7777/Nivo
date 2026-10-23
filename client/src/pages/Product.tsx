import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Layout, EmptyState } from "@/components/Layout";
import { Reveal } from "@/components/Reveal";
import { trpc } from "@/_core/trpc";
import { formatEGP, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  women: "نسائي",
  men: "رجالي",
  knitwear: "تريكو",
};

export default function Product() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const query = trpc.catalog.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const { add } = useCart();

  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  const product = query.data;
  const sizes = (product?.sizes ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const gallery = (product?.galleryUrls ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const images = gallery.length ? gallery : product?.imageUrl ? [product.imageUrl] : [];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setSize(sizes[0] ?? "");
    setActiveImage(0);
    setAdded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (query.isLoading) {
    return (
      <Layout>
        <div className="container-nivo grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="aspect-[3/4] animate-pulse bg-sand" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse bg-sand" />
            <div className="h-10 w-2/3 animate-pulse bg-sand" />
            <div className="h-4 w-1/3 animate-pulse bg-sand" />
          </div>
        </div>
      </Layout>
    );
  }

  if (query.isError || !product) {
    return (
      <Layout>
        <div className="container-nivo py-24">
          <EmptyState
            title="القطعة دي مش موجودة"
            body="يمكن الرابط قديم أو القطعة خلصت. شوف باقي المجموعة."
            action={
              <Link
                to="/shop"
                className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
              >
                كل القطع
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const soldOut = product.stock <= 0;

  return (
    <Layout>
      <div className="container-nivo py-10 md:py-16">
        <nav className="mb-8 flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link to="/shop" className="transition-colors hover:text-olive">
            المتجر
          </Link>
          <span aria-hidden>/</span>
          <Link
            to={`/shop/${product.category}`}
            className="transition-colors hover:text-olive"
          >
            {CATEGORY_LABEL[product.category] ?? product.category}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div>
              <div className="img-zoom aspect-[3/4] bg-sand">
                {images[activeImage] ? (
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                    بدون صورة
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 flex gap-3">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "h-20 w-16 overflow-hidden border transition-colors",
                        i === activeImage ? "border-olive" : "border-line hover:border-ink/40",
                      )}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="md:pt-4">
              <p className="eyebrow">
                {product.garmentType || product.collection}
              </p>
              <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)] leading-tight text-ink">
                {product.name}
              </h1>

              {product.tagline && (
                <p className="mt-3 text-[14px] leading-loose text-muted-foreground">
                  {product.tagline}
                </p>
              )}

              <div className="mt-5 flex items-baseline gap-3">
                <p className="text-xl text-ink">{formatEGP(product.price)}</p>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatEGP(product.compareAtPrice)}
                  </p>
                )}
              </div>

              {product.material && (
                <p className="mt-6 border-t border-line pt-6 text-[13px] text-muted-foreground">
                  {product.material}
                </p>
              )}

              {sizes.length > 0 && (
                <div className="mt-7">
                  <p className="eyebrow">المقاس</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={cn(
                          "min-w-12 border px-4 py-2 text-[13px] transition-colors",
                          size === s
                            ? "border-olive bg-olive text-cream"
                            : "border-line text-ink hover:border-ink/40",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && (
                <p className="mt-6 text-[13px] text-muted-foreground">
                  الألوان المتاحة: {product.colors}
                </p>
              )}

              <button
                type="button"
                disabled={soldOut}
                onClick={() => {
                  add({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    size,
                    qty: 1,
                  });
                  setAdded(true);
                }}
                className={cn(
                  "mt-9 w-full py-4 text-[13px] tracking-[0.16em] transition-colors",
                  soldOut
                    ? "cursor-not-allowed bg-sand text-muted-foreground"
                    : "bg-olive text-cream hover:bg-olive-dark",
                )}
              >
                {soldOut ? "خلصت خلاص" : added ? "اتضافت للسلة ✓" : "ضيف للسلة"}
              </button>

              {added && (
                <Link
                  to="/cart"
                  className="mt-4 block text-center text-[13px] text-olive transition-opacity hover:opacity-70"
                >
                  روح للسلة وكمّل الطلب ←
                </Link>
              )}

              {product.description && (
                <div className="mt-9 border-t border-line pt-7">
                  <p className="eyebrow">التفاصيل</p>
                  <p className="mt-4 text-[14px] leading-loose text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mt-8 border border-line bg-sand p-5">
                <p className="text-[13px] text-ink">إصلاح مدى الحياة</p>
                <p className="mt-2 text-[12px] leading-loose text-muted-foreground">
                  لو القطعة اتقطعت أو محتاجة تعديل، ابعتلنا وهي بترجع زي الأول — من غير أي تكلفة.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
}
