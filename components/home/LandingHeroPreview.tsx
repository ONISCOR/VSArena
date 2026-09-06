"use client";

import { LandingDiorama } from "@/components/home/LandingDiorama";
import { useI18n } from "@/components/i18n/LocaleProvider";

/**
 * Product window: animated work-cell plus match HUD. Drop public/brand/arena-loop.mp4 later to replace the SVG.
 *
 * @example <LandingHeroPreview />
 */
export function LandingHeroPreview() {
  const { m } = useI18n();
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-arena-cyan/20 via-transparent to-arena-orange/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0c0e12] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 text-xs text-arena-muted">vsarena.app / studio</span>
          <span className="ml-auto text-[10px] text-arena-muted">{m.landing.preview}</span>
        </div>
        <div className="relative">
          <LandingDiorama />
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] text-white backdrop-blur-sm">
            {m.nav.studio}
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-3 py-2.5 font-mono text-[10px] text-arena-muted">
          {m.landing.previewFoot}
        </div>
      </div>
    </div>
  );
}
