"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { IndustrialEnv, IndustrialHall, IndustrialLook } from "@/components/simulation/set-v2";
import { SPECTATE_REST, SpectateWorkcell } from "@/components/simulation/SpectateWorkcell";
import { failureSampleIndex, type ReplaySample } from "@/lib/eval/replay";
import { BLOCK_SPAWNS, TABLE_TOP_Y } from "@/simulation/constants";
import type { BlockState, JointState } from "@/simulation/types";

const CAM: [number, number, number] = [1.15, 1.05, 1.05];
const CAM_TARGET: [number, number, number] = [0.08, TABLE_TOP_Y + 0.1, 0];

const COLOR_BY_ID = Object.fromEntries(BLOCK_SPAWNS.map((b) => [b.id, b.color])) as Record<
  string,
  string
>;

function sampleToBlocks(sample: ReplaySample): BlockState[] {
  return sample.blocks.map((b) => ({
    id: b.id,
    position: b.position,
    rotation: b.rotation,
    color: COLOR_BY_ID[b.id] ?? "#888888",
  }));
}

export function RunReplayPlayer({
  samples,
  labels,
}: {
  samples: ReplaySample[];
  labels: {
    play: string;
    pause: string;
    stepBack: string;
    stepForward: string;
    jumpFailure: string;
    tick: string;
    empty: string;
    grasp: string;
  };
}) {
  const jointsRef = useRef<JointState>({ ...SPECTATE_REST });
  const blocksRef = useRef<BlockState[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const failIndex = useMemo(() => failureSampleIndex(samples), [samples]);

  const apply = useCallback(
    (i: number) => {
      const sample = samples[i];
      if (!sample) return;
      jointsRef.current = { ...sample.joints };
      blocksRef.current = sampleToBlocks(sample);
      setIndex(i);
    },
    [samples],
  );

  useEffect(() => {
    if (samples.length === 0) return;
    apply(0);
  }, [samples, apply]);

  useEffect(() => {
    if (!playing || samples.length === 0) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= samples.length) {
          setPlaying(false);
          return prev;
        }
        const sample = samples[next];
        jointsRef.current = { ...sample.joints };
        blocksRef.current = sampleToBlocks(sample);
        return next;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [playing, samples]);

  if (samples.length === 0) {
    return (
      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-10 text-sm text-[var(--mute)]">
        {labels.empty}
      </div>
    );
  }

  const sample = samples[index] ?? samples[0];
  const max = Math.max(0, samples.length - 1);

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--void)]">
      <div className="relative aspect-[16/10] w-full">
        <Canvas
          className="h-full w-full"
          camera={{ position: CAM, fov: 42, near: 0.05, far: 40 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl, camera }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.outputColorSpace = SRGBColorSpace;
            camera.lookAt(...CAM_TARGET);
          }}
        >
          <color attach="background" args={["#07090c"]} />
          <IndustrialEnv />
          <IndustrialHall />
          <IndustrialLook />
          <SpectateWorkcell jointsRef={jointsRef} blocksRef={blocksRef} ready />
          <OrbitControls target={CAM_TARGET} enablePan={false} minDistance={0.8} maxDistance={3.2} />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-3 p-3 text-[11px] text-[var(--mute)]">
          <span className="mono rounded-full border border-[var(--line)] bg-black/45 px-2.5 py-1">
            {labels.tick} {sample.tick}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-black/45 px-2.5 py-1">
            {labels.grasp}: {sample.grasped_block_id ?? "—"}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--line)] bg-[var(--lift)] px-4 py-4">
        <input
          type="range"
          min={0}
          max={max}
          value={index}
          aria-label="Replay timeline"
          className="w-full accent-[var(--cyan)]"
          onChange={(e) => {
            setPlaying(false);
            apply(Number(e.target.value));
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost !py-1.5 text-[12px]"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? labels.pause : labels.play}
          </button>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 text-[12px]"
            onClick={() => {
              setPlaying(false);
              apply(Math.max(0, index - 1));
            }}
          >
            {labels.stepBack}
          </button>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 text-[12px]"
            onClick={() => {
              setPlaying(false);
              apply(Math.min(max, index + 1));
            }}
          >
            {labels.stepForward}
          </button>
          <button
            type="button"
            className="btn btn-ghost !py-1.5 text-[12px]"
            disabled={failIndex < 0}
            onClick={() => {
              setPlaying(false);
              if (failIndex >= 0) apply(failIndex);
            }}
          >
            {labels.jumpFailure}
          </button>
          <span className="mono ml-auto self-center text-[11px] text-[var(--faint)]">
            {index + 1}/{samples.length}
          </span>
        </div>
      </div>
    </div>
  );
}
