import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/_core/trpc";

/** Deep-forest footer with the newsletter form, as in the video. */
export function Footer() {
  const settings = trpc.settings.public.useQuery();
  const s = settings.data ?? {};
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setDone(true);
      setEmail("");
    },
  });

  const socials = [
    { url: s.instagramUrl, name: s.instagramName || "Instagram" },
    { url: s.facebookUrl, name: s.facebookName || "Facebook" },
    { url: s.tiktokUrl, name: s.tiktokName || "TikTok" },
    { url: s.pinterestUrl, name: s.pinterestName || "Pinterest" },
  ].filter((x) => x.url);

  return (
    <footer className="mt-24 bg-forest text-cream/85">
      <div className="container-nivo grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <div className="md:col-span-2">
          <p className="wordmark text-[17px] text-cream">{s.logoText || "NIVO"}</p>
          <p className="mt-5 max-w-sm font-display text-2xl leading-relaxed text-cream/90">
            {s.brandLine || "هدوم تفضل هادية."}
          </p>
          <form
            className="mt-8 flex max-w-sm items-center gap-2 border-b border-cream/25 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim().length < 5) return;
              subscribe.mutate({ email: email.trim() });
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              className="w-full bg-transparent py-2 text-sm text-cream placeholder:text-cream/45 focus:outline-none"
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="shrink-0 text-[12px] tracking-[0.18em] text-cream/80 transition-colors hover:text-cream disabled:opacity-50"
            >
              اشترك
            </button>
          </form>
          {done && <p className="mt-3 text-[12px] text-cream/60">تمام — بقيت على القائمة.</p>}
          {subscribe.isError && (
            <p className="mt-3 text-[12px] text-cream/60">حصلت مشكلة، جرّب تاني.</p>
          )}
        </div>

        <div>
          <p className="eyebrow text-cream/45">المتجر</p>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { href: "/shop", label: "كل القطع" },
              { href: "/shop/women", label: "نسائي" },
              { href: "/shop/men", label: "رجالي" },
              { href: "/shop/knitwear", label: "تريكو" },
            ].map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="text-cream/75 transition-colors hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-cream/45">الاستوديو</p>
          <ul className="mt-5 space-y-3 text-sm text-cream/75">
            {s.email && <li>{s.email}</li>}
            {s.phone && <li dir="ltr" className="text-end">{s.phone}</li>}
            {s.address && <li>{s.address}</li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
              {socials.map((x) => (
                <li key={x.url}>
                  <a
                    href={x.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cream/60 transition-colors hover:text-cream"
                  >
                    {x.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-cream/12">
        <div className="container-nivo flex flex-col gap-3 py-6 text-[11px] text-cream/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} NIVO — كل الحقوق محفوظة.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/shipping" className="transition-colors hover:text-cream/80">
              الشحن والاسترجاع
            </Link>
            <Link to="/materials" className="transition-colors hover:text-cream/80">
              الخامات
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-cream/80">
              الخصوصية
            </Link>
            <Link to="/terms" className="transition-colors hover:text-cream/80">
              الشروط
            </Link>
            <Link to="/admin" className="transition-colors hover:text-cream/80">
              استوديو
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
