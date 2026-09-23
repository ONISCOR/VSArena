"use client";

import { useI18n } from "@/lib/copy/useCopy";

/** Trailer plane — no live-dot overlays, no glow stickers. */
export function WorkCell() {
  const { t } = useI18n();
  return (
    <div className="relative isolate overflow-hidden rounded-[22px] border border-[var(--line)] bg-[#07080b]">
      <video
        className="relative z-[1] aspect-video h-auto w-full object-cover md:max-h-[min(52vh,560px)]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/trailer.jpg?v=4"
        aria-label={t.a11y.workcell}
      >
        <source src="/media/trailer.mp4?v=4" type="video/mp4" />
        <source src="/media/trailer.webm?v=4" type="video/webm" />
      </video>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-12 md:px-6">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-white/70">{t.lab.cubeOrder}</p>
      </div>
    </div>
  );
}
