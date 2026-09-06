import { coverRect } from "@/lib/clip/formats";
import { STUDIO_VERSION } from "@/lib/eval/product";

export interface ClipOverlayState {
  phase: "recording" | "endcard";
  elapsedMs: number;
  tick: number;
  agent: string;
  grasped: boolean;
  matchStatus: string;
  complete: number | null;
  spatial: number | null;
  eloDelta: number | null;
}

function hudFont(): string {
  if (typeof document === "undefined") return "Rajdhani, sans-serif";
  const raw = getComputedStyle(document.body).getPropertyValue("--font-hud").trim();
  return raw ? `${raw}, Rajdhani, sans-serif` : "Rajdhani, sans-serif";
}

function monoFont(): string {
  if (typeof document === "undefined") return "IBM Plex Mono, monospace";
  const raw = getComputedStyle(document.body).getPropertyValue("--font-mono").trim();
  return raw ? `${raw}, IBM Plex Mono, monospace` : "IBM Plex Mono, monospace";
}

function fitLogo(logo: HTMLImageElement, maxW: number, maxH: number): { lw: number; lh: number } {
  const ratio = logo.naturalWidth / Math.max(1, logo.naturalHeight);
  let lh = maxH;
  let lw = lh * ratio;
  if (lw > maxW) {
    lw = maxW;
    lh = lw / ratio;
  }
  return { lw, lh };
}

/**
 * Paint one branded social frame onto `ctx`. Source is the live WebGL canvas.
 *
 * @example drawClipFrame(ctx, gl.domElement, logo, { width: 720, height: 1280 }, hud)
 */
export function drawClipFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  logo: HTMLImageElement | null,
  size: { width: number; height: number },
  hud: ClipOverlayState,
): void {
  const { width: w, height: h } = size;
  const s = Math.min(w, h) / 720;
  ctx.fillStyle = "#0A0C10";
  ctx.fillRect(0, 0, w, h);

  const srcW = "width" in source ? Number(source.width) : w;
  const srcH = "height" in source ? Number(source.height) : h;
  if (hud.phase === "recording" && srcW > 0 && srcH > 0) {
    const crop = coverRect(srcW, srcH, w, h);
    const oneToOne = Math.abs(crop.sw - w) < 1 && Math.abs(crop.sh - h) < 1;
    ctx.imageSmoothingEnabled = !oneToOne;
    if (!oneToOne) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
  }

  if (hud.phase === "endcard") {
    drawEndCard(ctx, logo, w, h, s, hud);
    return;
  }

  drawLiveChrome(ctx, logo, w, h, s, hud);
}

function drawLiveChrome(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  w: number,
  h: number,
  s: number,
  hud: ClipOverlayState,
): void {
  const top = ctx.createLinearGradient(0, 0, 0, 140 * s);
  top.addColorStop(0, "rgba(10,12,16,0.92)");
  top.addColorStop(1, "rgba(10,12,16,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, 150 * s);

  const bot = ctx.createLinearGradient(0, h - 220 * s, 0, h);
  bot.addColorStop(0, "rgba(10,12,16,0)");
  bot.addColorStop(1, "rgba(10,12,16,0.94)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, h - 230 * s, w, 230 * s);

  if (logo && logo.complete && logo.naturalWidth > 0) {
    const fit = fitLogo(logo, 168 * s, 56 * s);
    ctx.drawImage(logo, 22 * s, 16 * s, fit.lw, fit.lh);
  } else {
    ctx.fillStyle = "#00AEEF";
    ctx.font = `700 ${13 * s}px ${hudFont()}`;
    ctx.fillText("VS ARENA", 28 * s, 38 * s);
  }

  ctx.fillStyle = "#7B8A99";
  ctx.font = `500 ${11 * s}px ${monoFont()}`;
  ctx.fillText(`STUDIO v${STUDIO_VERSION}`, 28 * s, 16 * s + 62 * s);

  const recX = w - 28 * s;
  ctx.fillStyle = "#F7941E";
  ctx.beginPath();
  ctx.arc(recX - 86 * s, 36 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${16 * s}px ${hudFont()}`;
  ctx.textAlign = "right";
  ctx.fillText("REC", recX - 98 * s, 42 * s);
  ctx.font = `500 ${16 * s}px ${monoFont()}`;
  ctx.fillStyle = "#00AEEF";
  const total = Math.max(0, Math.floor(hud.elapsedMs / 1000));
  const clock = `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
  ctx.fillText(clock, recX, 42 * s);
  ctx.textAlign = "left";

  ctx.fillStyle = "#00AEEF";
  ctx.font = `700 ${12 * s}px ${hudFont()}`;
  ctx.fillText("BLOCK STACKING", 28 * s, h - 88 * s);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${28 * s}px ${hudFont()}`;
  ctx.fillText(hud.agent.toUpperCase(), 28 * s, h - 54 * s);
  ctx.fillStyle = "#7B8A99";
  ctx.font = `500 ${12 * s}px ${monoFont()}`;
  const grip = hud.grasped ? "GRASPED" : "FREE";
  ctx.fillText(`TICK ${hud.tick}  ·  ${grip}  ·  NOVACODING-G`, 28 * s, h - 28 * s);

  if (hud.complete !== null) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#00AEEF";
    ctx.font = `700 ${12 * s}px ${hudFont()}`;
    ctx.fillText("COMPLETE", w - 28 * s, h - 72 * s);
    ctx.font = `700 ${36 * s}px ${monoFont()}`;
    ctx.fillText(hud.complete.toFixed(3), w - 28 * s, h - 32 * s);
    ctx.textAlign = "left";
  }
}

function drawEndCard(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  w: number,
  h: number,
  s: number,
  hud: ClipOverlayState,
): void {
  const glow = ctx.createRadialGradient(w / 2, h * 0.38, 20 * s, w / 2, h * 0.38, 280 * s);
  glow.addColorStop(0, "rgba(0,174,239,0.22)");
  glow.addColorStop(1, "rgba(10,12,16,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (logo && logo.complete && logo.naturalWidth > 0) {
    const fit = fitLogo(logo, w * 0.72, h * 0.28);
    ctx.drawImage(logo, (w - fit.lw) / 2, h * 0.12, fit.lw, fit.lh);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#00AEEF";
  ctx.font = `700 ${14 * s}px ${hudFont()}`;
  ctx.fillText("VS ARENA", w / 2, h * 0.42);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${22 * s}px ${hudFont()}`;
  ctx.fillText(`STUDIO v${STUDIO_VERSION}`, w / 2, h * 0.47);
  ctx.fillStyle = "#7B8A99";
  ctx.font = `500 ${14 * s}px ${monoFont()}`;
  ctx.fillText(hud.agent.toUpperCase() + "  ·  BLOCK STACKING", w / 2, h * 0.52);

  if (hud.complete !== null && hud.spatial !== null) {
    const boxY = h * 0.58;
    const boxW = 190 * s;
    const gap = 16 * s;
    const totalW = boxW * 3 + gap * 2;
    let x = (w - totalW) / 2;
    const cards: Array<{ k: string; v: string; c: string }> = [
      { k: "COMPLETE", v: hud.complete.toFixed(3), c: "#00AEEF" },
      { k: "SPATIAL", v: hud.spatial.toFixed(3), c: "#FFFFFF" },
      {
        k: "ELO Δ",
        v: hud.eloDelta === null ? "—" : hud.eloDelta >= 0 ? `+${hud.eloDelta}` : String(hud.eloDelta),
        c: "#F7941E",
      },
    ];
    for (const card of cards) {
      ctx.fillStyle = "rgba(0,174,239,0.08)";
      ctx.strokeStyle = "rgba(0,174,239,0.35)";
      ctx.lineWidth = 1;
      ctx.fillRect(x, boxY, boxW, 88 * s);
      ctx.strokeRect(x, boxY, boxW, 88 * s);
      ctx.fillStyle = "#7B8A99";
      ctx.font = `700 ${11 * s}px ${hudFont()}`;
      ctx.fillText(card.k, x + boxW / 2, boxY + 24 * s);
      ctx.fillStyle = card.c;
      ctx.font = `700 ${26 * s}px ${monoFont()}`;
      ctx.fillText(card.v, x + boxW / 2, boxY + 62 * s);
      x += boxW + gap;
    }
  }

  ctx.fillStyle = "#00AEEF";
  ctx.font = `500 ${12 * s}px ${monoFont()}`;
  ctx.fillText("BUILT BY NOVACODING-G  ·  #VSARENA", w / 2, h * 0.88);
  ctx.textAlign = "left";
}
