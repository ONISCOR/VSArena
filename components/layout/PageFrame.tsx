import type { ReactNode } from "react";

interface PageFrameProps {
  kicker?: string;
  title: string;
  children: ReactNode;
}

/**
 * Editorial inner-page layout.
 */
export function PageFrame({ kicker, title, children }: PageFrameProps) {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 md:py-20">
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1 className="display mt-3 text-4xl tracking-tight text-[var(--ink)] md:text-5xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
