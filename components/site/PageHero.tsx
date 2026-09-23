"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

export function PageHero({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-10 pt-28 md:px-8 lg:pt-16">
      <Reveal>
        <p className="kicker">{kicker}</p>
        <h1 className="display mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5.4rem)]">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--mute)]">{lead}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </Reveal>
    </section>
  );
}
