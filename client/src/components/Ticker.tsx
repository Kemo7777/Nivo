// The infinite strip under the hero. The track holds the items TWICE so the
// -50% marquee keyframe loops seamlessly; it pauses on hover (see .marquee in
// index.css) and stops entirely under prefers-reduced-motion.
const ITEMS = [
  "خامات طبيعية",
  "إنتاج بكميات صغيرة",
  "توصيل صفري الكربون",
  "مصنوعة في البرتغال",
  "إصلاح مدى الحياة",
  "مصممة في كوبنهاجن",
];

export function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee overflow-hidden border-y border-line bg-sand py-4">
      <div className="marquee-track">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-6 px-6 text-[12px] tracking-[0.22em] text-muted-foreground"
          >
            {item}
            <span aria-hidden className="text-olive">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
