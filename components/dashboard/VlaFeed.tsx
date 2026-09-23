"use client";

import { useEffect, useRef } from "react";
import { useHudStore } from "@/lib/store";

/**
 * Pixel-perfect VLA work-cell camera (same buffer the policy sees).
 */
export function VlaFeed({ bare = false }: { bare?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rgb = useHudStore((s) => s.vlaRgb);
  const size = useHudStore((s) => s.vlaSize);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rgb || rgb.length < size * size * 3) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(size, size);
    for (let i = 0, p = 0; i < rgb.length; i += 3, p += 4) {
      image.data[p] = rgb[i];
      image.data[p + 1] = rgb[i + 1];
      image.data[p + 2] = rgb[i + 2];
      image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [rgb, size]);

  const frame = (
    <canvas
      ref={canvasRef}
      className={bare ? "mt-2 h-[132px] w-full rounded-xl bg-[#07090c]" : "h-[128px] w-full bg-[#07090c]"}
      style={{ imageRendering: "pixelated" }}
    />
  );

  if (bare) return frame;

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <p className="text-xs font-medium text-white">
          VLA camera {size}×{size}
        </p>
      </header>
      {frame}
      <p className="px-3 py-1.5 font-mono text-[10px] text-arena-muted">
        Policy feed: top-down RGB · no cube GPS. Pixels are not the Three.js view.
      </p>
    </section>
  );
}
