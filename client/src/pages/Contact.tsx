import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Reveal } from "@/components/Reveal";
import { trpc } from "@/_core/trpc";

const SUBJECTS = ["استفسار عام", "مقاس أو تفاصيل قطعة", "طلب أو شحن", "إصلاح قطعة", "تعاون"];

export default function Contact() {
  const settings = trpc.settings.public.useQuery();
  const s = settings.data ?? {};

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: SUBJECTS[0],
    body: "",
  });
  const [sent, setSent] = useState(false);

  const send = trpc.messages.create.useMutation({
    onSuccess: () => {
      setSent(true);
      setForm({ name: "", email: "", subject: SUBJECTS[0], body: "" });
    },
  });

  const remaining = 500 - form.body.length;

  const rows = [
    { label: "البريد", value: s.email },
    { label: "الموبايل", value: s.phone, ltr: true },
    { label: "ساعات الرد", value: s.phoneHours },
    { label: "العنوان", value: s.address },
    { label: "ملاحظة", value: s.addressNote },
    { label: "الورشة", value: s.productionHours },
  ].filter((r) => r.value);

  const socials = [
    { url: s.instagramUrl, name: s.instagramName || "Instagram" },
    { url: s.facebookUrl, name: s.facebookName || "Facebook" },
    { url: s.tiktokUrl, name: s.tiktokName || "TikTok" },
    { url: s.pinterestUrl, name: s.pinterestName || "Pinterest" },
  ].filter((x) => x.url);

  const mapQuery = encodeURIComponent(s.address || "الزمالك، القاهرة");

  return (
    <Layout>
      <section className="container-nivo pt-14 pb-10 md:pt-20 md:pb-14">
        <p className="eyebrow">تواصل</p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-tight text-ink">
          اكتب للاستوديو
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-loose text-muted-foreground">
          عندك سؤال عن مقاس، طلب، أو إصلاح قطعة؟ ابعتلنا وهنرد عليك في نفس يوم العمل.
        </p>
      </section>

      <section className="container-nivo pb-20 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Form */}
          <Reveal>
            <form
              className="border border-line bg-card p-6 md:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                send.mutate(form);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">اسمك</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full border border-line bg-transparent px-3 py-2.5 text-[14px] text-ink focus:border-olive focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">البريد الإلكتروني</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 w-full border border-line bg-transparent px-3 py-2.5 text-[14px] text-ink focus:border-olive focus:outline-none"
                  />
                </label>
              </div>

              <label className="mt-5 block">
                <span className="text-[12px] text-muted-foreground">الموضوع</span>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1.5 w-full border border-line bg-transparent px-3 py-2.5 text-[14px] text-ink focus:border-olive focus:outline-none"
                >
                  {SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block">
                <span className="text-[12px] text-muted-foreground">الرسالة</span>
                <textarea
                  required
                  rows={6}
                  maxLength={500}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="mt-1.5 w-full resize-none border border-line bg-transparent px-3 py-2.5 text-[14px] leading-loose text-ink focus:border-olive focus:outline-none"
                />
                <span className="mt-1.5 block text-end text-[11px] text-muted-foreground">
                  {remaining.toLocaleString("ar-EG")} حرف فاضل
                </span>
              </label>

              {send.isError && (
                <p className="mt-4 text-[12px] text-destructive">{send.error.message}</p>
              )}
              {sent && (
                <p className="mt-4 text-[12px] text-olive">
                  وصلتنا رسالتك — هنرد عليك قريب.
                </p>
              )}

              <button
                type="submit"
                disabled={send.isPending}
                className="mt-6 w-full bg-olive py-3.5 text-[13px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark disabled:opacity-60 sm:w-auto sm:px-10"
              >
                {send.isPending ? "بنبعت…" : "ابعت الرسالة"}
              </button>
            </form>
          </Reveal>

          {/* Studio details + map panel */}
          <Reveal delay={100}>
            <div>
              <dl className="border-t border-line">
                {rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-start justify-between gap-6 border-b border-line py-4"
                  >
                    <dt className="shrink-0 text-[12px] text-muted-foreground">{r.label}</dt>
                    <dd
                      className="text-end text-[14px] text-ink"
                      dir={r.ltr ? "ltr" : undefined}
                    >
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {socials.length > 0 && (
                <div className="mt-8">
                  <p className="eyebrow">تابعنا</p>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                    {socials.map((x) => (
                      <li key={x.url}>
                        <a
                          href={x.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink transition-colors hover:text-olive"
                        >
                          {x.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Designed map panel — no third-party tiles, just a link out. */}
              <div className="mt-8 border border-line bg-sand p-6">
                <p className="eyebrow">الاستوديو على الخريطة</p>
                <p className="mt-3 text-[14px] text-ink">{s.mapText || "الزمالك، القاهرة"}</p>
                <div className="relative mt-5 h-40 overflow-hidden border border-line bg-cream">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(#e5e1d8 1px, transparent 1px), linear-gradient(90deg, #e5e1d8 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-3 w-3 items-center justify-center">
                      <span className="absolute h-3 w-3 animate-ping rounded-full bg-olive/40" />
                      <span className="h-2.5 w-2.5 rounded-full bg-olive" />
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-[12px] tracking-wide text-olive transition-opacity hover:opacity-70"
                >
                  افتح في الخرائط ←
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
