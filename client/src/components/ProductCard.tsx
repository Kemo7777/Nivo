import { Link } from "wouter";
import { formatEGP, useCart } from "@/lib/cart";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  material: string;
  category: string;
  sizes: string;
  stock: number;
  isNew?: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  women: "نسائي",
  men: "رجالي",
  knitwear: "تريكو",
};

/** A piece in a grid. Hovering zooms the photo and fades in a quick-add. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;
  const firstSize = product.sizes.split(",")[0]?.trim() ?? "";

  return (
    <article className="group">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="img-zoom relative aspect-[3/4] bg-sand">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
              بدون صورة
            </div>
          )}
          {soldOut && (
            <span className="absolute top-3 start-3 bg-cream/90 px-2.5 py-1 text-[10px] tracking-[0.18em] text-ink">
              خلصت
            </span>
          )}
          {!soldOut && product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="absolute top-3 start-3 bg-olive px-2.5 py-1 text-[10px] tracking-[0.18em] text-cream">
              تخفيض
            </span>
          )}
          {!soldOut && product.isNew && !(product.compareAtPrice && product.compareAtPrice > product.price) && (
            <span className="absolute top-3 start-3 bg-ink px-2.5 py-1 text-[10px] tracking-[0.18em] text-cream">
              جديد
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{CATEGORY_LABEL[product.category] ?? product.category}</p>
          <Link to={`/product/${product.slug}`}>
            <h3 className="mt-1.5 truncate text-[17px] text-ink transition-colors group-hover:text-olive">
              {product.name}
            </h3>
          </Link>
          {product.material && (
            <p className="mt-1 truncate text-[12px] text-muted-foreground">{product.material}</p>
          )}
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[15px] text-ink">{formatEGP(product.price)}</p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-[12px] text-muted-foreground line-through">
              {formatEGP(product.compareAtPrice)}
            </p>
          )}
        </div>
      </div>

      {!soldOut && (
        <button
          type="button"
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              size: firstSize,
              qty: 1,
            })
          }
          className="mt-3 w-full border border-line py-2.5 text-[12px] tracking-[0.16em] text-ink transition-colors hover:border-olive hover:bg-olive hover:text-cream"
        >
          ضيف للسلة
        </button>
      )}
    </article>
  );
}
