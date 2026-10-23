import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { trpc } from "@/_core/trpc";

const NAV = [
  { href: "/shop", label: "المتجر" },
  { href: "/shop/women", label: "نسائي" },
  { href: "/shop/men", label: "رجالي" },
  { href: "/shop/knitwear", label: "تريكو" },
  { href: "/contact", label: "تواصل" },
];

/**
 * Sticky header. It is transparent over the hero and gains a hairline + blur
 * once the page scrolls — the behaviour the video shows.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { count } = useCart();
  const settings = trpc.settings.public.useQuery();
  const logoText = settings.data?.logoText || "NIVO";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-nivo flex h-16 items-center justify-between gap-4 md:h-20">
        <button
          type="button"
          aria-label="القائمة"
          onClick={() => setOpen((v) => !v)}
          className="-ms-2 p-2 text-ink md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "text-[13px] tracking-wide text-ink/80 transition-colors hover:text-olive",
                location === item.href && "text-olive",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="wordmark text-[15px] text-ink md:text-[17px]">
          {logoText}
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.slice(4).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-[13px] tracking-wide text-ink/80 transition-colors hover:text-olive",
                  location === item.href && "text-olive",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/cart"
            aria-label="السلة"
            className="relative -me-2 p-2 text-ink transition-colors hover:text-olive"
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-medium text-cream">
                {count.toLocaleString("ar-EG")}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="animate-fade border-t border-line bg-cream md:hidden">
          <nav className="container-nivo flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="border-b border-line/60 py-3.5 text-[15px] text-ink last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
