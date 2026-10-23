import { useMemo, useState } from "react";
import { Layout, EmptyState } from "@/components/Layout";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";

type Category = "all" | "women" | "men" | "knitwear";

const PILLS: { value: Category; label: string }[] = [
  { value: "all", label: "كل حاجة" },
  { value: "women", label: "نسائي" },
  { value: "men", label: "رجالي" },
  { value: "knitwear", label: "تريكو" },
];

const SORTS = [
  { value: "featured", label: "الأكثر تميزاً" },
  { value: "price-asc", label: "السعر الأقل" },
  { value: "newest", label: "الأحدث" },
];

const COPY: Record<Category, { eyebrow: string; title: string; intro: string }> = {
  all: {
    eyebrow: "الكولكشن",
    title: "كل القطع",
    intro:
      "خمسة عشر موديل في المجموعة الحالية — من بالطو الصوف الطويل للتريكو الخفيف. كل قطعة بتتعمل بكميات صغيرة.",
  },
  women: {
    eyebrow: "الكولكشن",
    title: "ملابس نسائية",
    intro:
      "قصات مستقيمة وخامات طبيعية. قطع بتلبسها لوحدها أو فوق بعض من غير ما تبقى تقيلة.",
  },
  men: {
    eyebrow: "الكولكشن",
    title: "ملابس رجالية",
    intro: "قمصان كتان، بنطلونات صوف مفصّلة، وتريكو رقبة عالية. الأساسيات اللي بتفضل.",
  },
  knitwear: {
    eyebrow: "الكولكشن",
    title: "تريكو",
    intro: "صوف ميرينو وكشمير بحبكات ناعمة. دافي من غير حجم زيادة.",
  },
};

export default function Shop({ category = "all" }: { category?: Category }) {
  const [active, setActive] = useState<Category>(category);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = trpc.catalog.list.useQuery({ category: active, sort });
  const copy = COPY[active];
  const products = useMemo(() => query.data ?? [], [query.data]);

  return (
    <Layout>
      <section className="container-nivo pt-14 pb-10 md:pt-20 md:pb-14">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-tight text-ink">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-loose text-muted-foreground">
          {copy.intro}
        </p>
      </section>

      {/* Toolbar: category pills, count, sort, filter toggle. */}
      <section className="sticky top-16 z-30 border-y border-line bg-cream/90 backdrop-blur-md md:top-20">
        <div className="container-nivo flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {PILLS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setActive(p.value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[12px] transition-colors",
                  active === p.value
                    ? "border-olive bg-olive text-cream"
                    : "border-line text-ink/75 hover:border-ink/40",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="text-[12px] tracking-wide text-ink/70 transition-colors hover:text-olive"
            >
              الفلتر · {products.length.toLocaleString("ar-EG")} قطعة
            </button>
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="hidden sm:inline">ترتيب</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-line bg-transparent px-2 py-1.5 text-[12px] text-ink focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtersOpen && (
          <div className="animate-fade border-t border-line bg-sand">
            <div className="container-nivo flex flex-wrap items-center gap-x-8 gap-y-3 py-4 text-[12px] text-muted-foreground">
              <span>الفئة: {PILLS.find((p) => p.value === active)?.label}</span>
              <span>الترتيب: {SORTS.find((s) => s.value === sort)?.label}</span>
              <span>النتائج: {products.length.toLocaleString("ar-EG")} قطعة</span>
              <button
                type="button"
                onClick={() => {
                  setActive("all");
                  setSort("featured");
                }}
                className="text-olive transition-opacity hover:opacity-70"
              >
                إعادة ضبط الفلتر
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="container-nivo py-14 md:py-20">
        {query.isLoading && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-sand" />
                <div className="mt-4 h-3 w-2/3 bg-sand" />
                <div className="mt-2 h-3 w-1/3 bg-sand" />
              </div>
            ))}
          </div>
        )}

        {query.isError && (
          <EmptyState
            title="مش قادرين نجيب القطع"
            body="حصلت مشكلة في التحميل. جرّب تحدّث الصفحة."
          />
        )}

        {!query.isLoading && !query.isError && products.length === 0 && (
          <EmptyState
            title="مفيش حاجة مطابقة"
            body="جرّب توسيع نطاق السعر أو تبديل فلتر الفئة — أو شوف كل القطع."
            action={
              <button
                type="button"
                onClick={() => {
                  setActive("all");
                  setSort("featured");
                }}
                className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
              >
                إعادة ضبط الفلتر
              </button>
            }
          />
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}