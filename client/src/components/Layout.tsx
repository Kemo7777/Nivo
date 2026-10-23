import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

/** The storefront shell: sticky header, page content, dark footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** A designed empty state — every list in the app ships one. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-line bg-sand px-6 py-20 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  );
}

/** A section heading: small letterspaced label above a serif title. */
export function SectionHeading({
  eyebrow,
  title,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
