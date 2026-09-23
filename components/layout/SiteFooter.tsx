"use client";

import { Link } from "@/components/site/Link";
import { CubeMark } from "@/components/brand/CubeMark";
import { useCopy } from "@/lib/copy/useCopy";
import { FOOTER, site } from "@/lib/site";

export function SiteFooter() {
  const { t } = useCopy();

  const columns = [
    { title: t.footer.product, links: FOOTER.product },
    { title: t.footer.company, links: FOOTER.company },
    {
      title: t.footer.developers,
      links: [
        ...FOOTER.developers,
        { href: site.paper, key: "paper" },
      ],
    },
    { title: t.footer.legal, links: FOOTER.legal },
  ];

  return (
    <footer className="mt-auto shrink-0 border-t border-[var(--line)]">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5">
              <CubeMark className="h-10 w-10" />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">VSArena</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--mute)]">{t.footer.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => {
                    const external = link.href.startsWith("http");
                    const label =
                      link.key === "paper"
                        ? t.footer.paper
                        : (t.nav as Record<string, string>)[link.key] ??
                          (t.footer as Record<string, string>)[link.key] ??
                          link.key;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
                          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 h-px bg-[linear-gradient(90deg,transparent,rgba(244,240,230,0.16),transparent)]" />
        <p className="mt-6 text-xs text-[var(--faint)]">{t.footer.copy}</p>
      </div>
    </footer>
  );
}
