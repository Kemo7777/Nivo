import { Link } from "wouter";
import { Layout, SectionHeading } from "@/components/Layout";
import { Reveal } from "@/components/Reveal";
import { Ticker } from "@/components/Ticker";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/_core/trpc";

const PRINCIPLES = [
  {
    n: "٠١",
    title: "خامات نعرف مصدرها",
    body: "صوف من مزارع في البرتغال، كتان من إيطاليا، وكشمير من مورد واحد بنتعامل معاه من ٢٠١٩. كل خامة ليها اسم ومكان.",
  },
  {
    n: "٠٢",
    title: "قص بكميات صغيرة",
    body: "بنقص ٤٠–٨٠ قطعة من كل موديل. مش بنعمل مخزون كبير، ومش بنحرق حاجة في آخر الموسم.",
  },
  {
    n: "٠٣",
    title: "بنصلّح، مش بنستبدل",
    body: "لو القطعة اتقطعت أو الأزرار وقعت، ابعتلنا وهي بترجع زي الأول. الإصلاح مجاني مدى الحياة.",
  },
];

const SERVICES = [
  { title: "شحن مجاني", body: "فوق ١٠٠٠ ج.م" },
  { title: "استرجاع ٣٠ يوم", body: "من غير أسئلة" },
  { title: "إصلاح مدى الحياة", body: "على كل قطعة" },
  { title: "توصيل صفري الكربون", body: "على كل الطلبات" },
];

export default function Home() {
  const featured = trpc.catalog.featured.useQuery();
  const settings = trpc.settings.public.useQuery();
  const s = settings.data ?? {};

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink md:-mt-20">
        <img
          src="/images/hero-coat.jpg"
          alt="موديل ببالطو صوف كريمي"
          className="animate-kenburns absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/35" />

        <div className="container-nivo relative flex h-full flex-col justify-end pb-16 md:pb-20">
          <p
            className="animate-rise eyebrow text-cream/70"
            style={{ animationDelay: "120ms" }}
          >
            خريف — شتاء ٢٤ • المجموعة الرقيقة
          </p>
          <h1
            className="animate-rise mt-5 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.5rem)] leading-[1.05] text-cream"
            style={{ animationDelay: "240ms" }}
          >
            {s.brandLine || "هدوم تفضل هادية."}
          </h1>
          <p
            className="animate-rise mt-6 max-w-xl text-[15px] leading-loose text-cream/80 md:text-base"
            style={{ animationDelay: "360ms" }}
          >
            قطع بتتعمل ببطء، من خامات طبيعية، وبتفضل معاك سنين. مش بنجري ورا الترند — بنعمل
            حاجة تلبسها وتنساها.
          </p>
          <div className="animate-rise mt-9" style={{ animationDelay: "480ms" }}>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-cream px-8 py-4 text-[13px] tracking-[0.16em] text-ink transition-colors hover:bg-white"
            >
              تسوق الكولكشن
              <span aria-hidden>←</span>
            </Link>
          </div>
        </div>

        {/* Corner captions, exactly as the video frames them. */}
        <div className="container-nivo pointer-events-none absolute inset-x-0 bottom-6 hidden items-end justify-between text-[11px] tracking-[0.2em] text-cream/60 md:flex">
          <span>مصنوعة في البرتغال وإيطاليا</span>
          <span className="animate-pulse">انزل ↓</span>
          <span>مصممة في كوبنهاجن</span>
        </div>
      </section>

      <Ticker />

      {/* ── Featured pieces ──────────────────────────────────────────────── */}
      <section className="container-nivo py-20 md:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="المجموعة"
            title="القطع اللي بنرجع لها دايماً"
            action={
              <Link
                to="/shop"
                className="text-[13px] tracking-wide text-olive transition-opacity hover:opacity-70"
              >
                شوف كل القطع ←
              </Link>
            }
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-7">
          {featured.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-sand" />
                <div className="mt-4 h-3 w-2/3 bg-sand" />
                <div className="mt-2 h-3 w-1/3 bg-sand" />
              </div>
            ))}
          {featured.data?.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Slow by design ───────────────────────────────────────────────── */}
      <section className="border-y border-line bg-sand py-20 md:py-28">
        <div className="container-nivo">
          <Reveal>
            <SectionHeading eyebrow="إزاي بنشتغل" title="بطيء بالقصد" />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 90}>
                <div className="border-t border-line pt-7">
                  <p className="font-display text-4xl text-olive">{p.n}</p>
                  <h3 className="mt-5 text-xl text-ink">{p.title}</h3>
                  <p className="mt-3 text-[14px] leading-loose text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial ────────────────────────────────────────────────────── */}
      <section className="container-nivo py-20 md:py-28">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="img-zoom aspect-[4/5] bg-sand">
              <img
                src="/images/editorial-two.jpg"
                alt="موديلين في فناء بخامات محايدة"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <p className="eyebrow">من الاستوديو</p>
              <blockquote className="mt-6 font-display text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.4] text-ink">
                «أحلى القطع هي اللي بتنسى إنك لابسها.»
              </blockquote>
              <p className="mt-6 max-w-md text-[15px] leading-loose text-muted-foreground">
                بنصمم من غير شعارات كبيرة ولا تفاصيل بتصرخ. القطعة بتتكلم في القماش، في الوزن،
                وفي إزاي بتقع على الجسم.
              </p>
              <Link
                to="/shop/knitwear"
                className="mt-8 inline-flex items-center gap-3 border-b border-ink pb-1 text-[13px] tracking-wide text-ink transition-colors hover:border-olive hover:text-olive"
              >
                تسوق التريكو
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="container-nivo grid grid-cols-2 gap-y-10 py-14 md:grid-cols-4 md:py-16">
          {SERVICES.map((svc, i) => (
            <Reveal key={svc.title} delay={i * 70}>
              <div className="px-1 text-center md:px-4">
                <p className="text-[15px] text-ink">{svc.title}</p>
                <p className="mt-2 text-[12px] text-muted-foreground">{svc.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Layout>
  );
}
