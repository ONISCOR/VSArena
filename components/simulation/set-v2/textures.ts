"use client";

import { useEffect, useMemo } from "react";
import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  LinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { useTheme } from "@/lib/theme";

function hash(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number): number {
  return (
    valueNoise(x, y) * 0.5 +
    valueNoise(x * 2.13, y * 2.13) * 0.27 +
    valueNoise(x * 4.41, y * 4.41) * 0.15 +
    valueNoise(x * 9.1, y * 9.1) * 0.08
  );
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const el = document.createElement("canvas");
  el.width = size;
  el.height = size;
  const ctx = el.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("2d canvas unavailable");
  return [el, ctx];
}

function toTexture(
  el: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  linear = false,
): CanvasTexture {
  const tex = new CanvasTexture(el);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = linear ? NoColorSpace : SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

function makeConcrete(light: boolean): { color: CanvasTexture; rough: CanvasTexture } {
  const size = 768;
  const [colorEl, colorCtx] = canvas(size);
  const [roughEl, roughCtx] = canvas(size);
  const color = colorCtx.createImageData(size, size);
  const rough = roughCtx.createImageData(size, size);
  const base = light ? 162 : 78;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / 62, y / 58);
      const grain = hash(x * 3, y * 5);
      const wavyX = x + valueNoise(x / 90, y / 90) * 18;
      const wavyY = y + valueNoise(x / 85 + 4, y / 85) * 18;
      const jx = Math.abs((wavyX % 210) - 3);
      const jy = Math.abs((wavyY % 196) - 3);
      const joint = jx < 4 || jy < 4 ? 0.72 + grain * 0.08 : 1;
      const oil = valueNoise(x / 140, y / 95) > 0.78 ? 0.82 : 1;
      const v = Math.max(0, Math.min(255, (base + (n - 0.5) * 52 + (grain - 0.5) * 18) * joint * oil));
      const i = (y * size + x) * 4;
      color.data[i] = v * (light ? 1.03 : 0.95);
      color.data[i + 1] = v * (light ? 1.0 : 0.98);
      color.data[i + 2] = v * (light ? 0.92 : 1.03);
      color.data[i + 3] = 255;
      const r = Math.max(90, Math.min(255, 150 + (1 - n) * 70 + (1 - joint) * 40));
      rough.data[i] = r;
      rough.data[i + 1] = r;
      rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  }
  colorCtx.putImageData(color, 0, 0);
  roughCtx.putImageData(rough, 0, 0);
  return { color: toTexture(colorEl, 5.2, 4.8), rough: toTexture(roughEl, 5.2, 4.8, true) };
}

function makePlaster(light: boolean, dado: boolean): CanvasTexture {
  const size = 512;
  const [el, ctx] = canvas(size);
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const base = light ? (dado ? 158 : 196) : dado ? 68 : 88;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / 140, y / 140);
      const v = Math.max(0, Math.min(255, base + (n - 0.5) * 14));
      const i = (y * size + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v * (light ? 0.97 : 1.02);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(el, dado ? 2.2 : 1.6, dado ? 0.7 : 1.05);
}

function makeHazard(): CanvasTexture {
  const size = 256;
  const [el, ctx] = canvas(size);
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(Math.PI / 4);
  const stripe = 28;
  for (let i = -size; i < size; i += stripe) {
    ctx.fillStyle = ((i / stripe) | 0) % 2 === 0 ? "#e8b423" : "#141414";
    ctx.fillRect(i, -size, stripe * 0.58, size * 2);
  }
  ctx.restore();
  return toTexture(el, 6, 1);
}

function makeAntiSlip(light: boolean): CanvasTexture {
  const size = 256;
  const [el, ctx] = canvas(size);
  ctx.fillStyle = light ? "#4f4a42" : "#1a1e24";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = light ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  const step = 12;
  for (let i = -size; i < size * 2; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
  return toTexture(el, 2.8, 1.9);
}

function makeStencil(light: boolean): CanvasTexture {
  const el = document.createElement("canvas");
  el.width = 768;
  el.height = 192;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable");
  ctx.clearRect(0, 0, el.width, el.height);
  ctx.fillStyle = light ? "rgba(24, 20, 14, 0.88)" : "rgba(236, 214, 118, 0.86)";
  ctx.font = "800 108px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CELL  01", 384, 96);
  const tex = new CanvasTexture(el);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

export function useHallMaps() {
  const light = useTheme().theme === "light";
  const maps = useMemo(() => {
    const concrete = makeConcrete(light);
    return {
      concrete: concrete.color,
      concreteRough: concrete.rough,
      plaster: makePlaster(light, false),
      dado: makePlaster(light, true),
      hazard: makeHazard(),
      slip: makeAntiSlip(light),
      stencil: makeStencil(light),
    };
  }, [light]);

  useEffect(() => {
    return () => {
      maps.concrete.dispose();
      maps.concreteRough.dispose();
      maps.plaster.dispose();
      maps.dado.dispose();
      maps.hazard.dispose();
      maps.slip.dispose();
      maps.stencil.dispose();
    };
  }, [maps]);

  return maps;
}
