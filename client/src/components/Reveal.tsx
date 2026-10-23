import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades + rises its children the first time they scroll into view. The CSS lives
 * in index.css (.js .reveal / .is-visible) and is disabled wholesale under
 * prefers-reduced-motion, so this only has to add the class.
 *
 * A fallback timer reveals everything shortly after mount. Without it, content
 * that never enters the viewport — a full-page screenshot, a print, a browser
 * that never fires the observer — would stay permanently invisible, which is a
 * far worse failure than losing the animation on a section nobody scrolled to.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add("is-visible");

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);

    // Safety net: never leave content hidden.
    const fallback = window.setTimeout(show, 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
