"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

interface ChangelogCardProps {
  compact?: boolean;
  className?: string;
}

/**
 * Release notes card used in Studio.
 *
 * @example <ChangelogCard compact />
 */
export function ChangelogCard({ compact = false, className }: ChangelogCardProps) {
  const { m } = useI18n();
  const items = [m.changelog.item1, m.changelog.item2];

  return (
    <article
      className={cn(
        "panel flex flex-col",
        compact ? "w-[16.5rem] p-3.5 backdrop-blur-xl" : "aspect-square w-[18rem] p-5",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-arena-cyan">{m.changelog.kicker}</p>
      <h2 className={cn("mt-1 font-semibold tracking-tight text-white", compact ? "text-base" : "text-lg")}>
        {m.changelog.version}
      </h2>
      <p className="text-[11px] text-arena-muted">{m.changelog.date}</p>
      <ul className={cn("mt-3 space-y-2 text-arena-muted", compact ? "text-[11px] leading-4" : "text-sm leading-5")}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-arena-orange" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
