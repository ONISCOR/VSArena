"use client";

import { create } from "zustand";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import type { JointState, SimEvent, Vec3 } from "@/simulation/types";
import type { ResultMessage } from "@/lib/harness/protocol";
import type { PlayTrick } from "@/lib/playground";

const MAX_METRICS = 80;
const MAX_TRAIL = 48;

export type MatchStatus = "idle" | "running" | "completed" | "failed";
export type CameraView = "orbit" | "table" | "top" | "side" | "play";

export interface MetricSample {
  tick: number;
  confidence: number;
  collision: number;
}

export interface TelemetryBlock {
  id: string;
  position: Vec3;
  color: string;
}

interface HudState {
  ready: boolean;
  error: string | null;
  joints: JointState;
  tick: number;
  graspedBlockId: string | null;
  blocks: TelemetryBlock[];
  tcp: Vec3;
  tcpTrail: Vec3[];
  /** Latest VLA work-cell RGB (128² packed), or null before first frame. */
  vlaRgb: Uint8Array | null;
  vlaSize: number;
  metrics: MetricSample[];
  showColliders: boolean;
  showGrid: boolean;
  showTrails: boolean;
  cameraView: CameraView;
  matchStatus: MatchStatus;
  matchResult: ResultMessage | null;
  matchRequest: "idle" | "start-baseline" | "start-colorseek" | "start-trick" | "abort" | "reset";
  playTrick: PlayTrick | null;
  setReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  syncTelemetry: (snapshot: {
    joints: JointState;
    tick: number;
    graspedBlockId: string | null;
    blocks: TelemetryBlock[];
    tcp: Vec3;
    vlaRgb?: Uint8Array;
    vlaSize?: number;
  }) => void;
  ingestEvents: (events: SimEvent[]) => void;
  requestBaselineMatch: () => void;
  requestColorSeekMatch: () => void;
  requestPlayTrick: (trick: PlayTrick) => void;
  abortMatch: () => void;
  requestTableReset: () => void;
  consumeMatchRequest: () => void;
  setMatchRunning: () => void;
  finishMatch: (result: ResultMessage) => void;
  toggleColliders: () => void;
  toggleGrid: () => void;
  toggleTrails: () => void;
  setCameraView: (view: CameraView) => void;
}

function jointDelta(prev: JointState, next: JointState): number {
  return (
    Math.abs(prev.baseYaw - next.baseYaw) +
    Math.abs(prev.shoulderPitch - next.shoulderPitch) +
    Math.abs(prev.elbowPitch - next.elbowPitch) +
    Math.abs(prev.wristPitch - next.wristPitch) +
    Math.abs(prev.gripper - next.gripper)
  );
}

export const useHudStore = create<HudState>((set) => ({
  ready: false,
  error: null,
  joints: { ...DEFAULT_JOINTS },
  tick: 0,
  graspedBlockId: null,
  blocks: [],
  tcp: [0, 0, 0],
  tcpTrail: [],
  vlaRgb: null,
  vlaSize: 128,
  metrics: [],
  showColliders: false,
  showGrid: false,
  showTrails: false,
  cameraView: "orbit",
  matchStatus: "idle",
  matchResult: null,
  matchRequest: "idle",
  playTrick: null,
  setReady: (ready) => set({ ready }),
  setError: (error) => set({ error, ready: false }),
  syncTelemetry: (snapshot) =>
    set((state) => {
      const delta = jointDelta(state.joints, snapshot.joints);
      const confidence = Math.min(
        70,
        18 + snapshot.joints.gripper * 12 + (snapshot.graspedBlockId ? 22 : 0) + Math.min(snapshot.tick / 12, 18),
      );
      const collision = Math.min(70, delta * 55);
      const sample: MetricSample = { tick: snapshot.tick, confidence, collision };
      const trail =
        snapshot.tick % 2 === 0
          ? [...state.tcpTrail, snapshot.tcp].slice(-MAX_TRAIL)
          : state.tcpTrail;
      return {
        joints: snapshot.joints,
        tick: snapshot.tick,
        graspedBlockId: snapshot.graspedBlockId,
        blocks: snapshot.blocks,
        tcp: snapshot.tcp,
        tcpTrail: trail,
        metrics: [...state.metrics, sample].slice(-MAX_METRICS),
        vlaRgb: snapshot.vlaRgb ?? state.vlaRgb,
        vlaSize: snapshot.vlaSize ?? state.vlaSize,
      };
    }),
  ingestEvents: (events) => {
    if (events.length === 0) return;
    set((state) => {
      const reset = events.some((event) => event.type === "reset" || event.type === "panic");
      const panic = events.find((event) => event.type === "panic");
      return {
        error: panic ? panic.message : state.error,
        tcpTrail: reset ? [] : state.tcpTrail,
        metrics: reset ? [] : state.metrics,
      };
    });
  },
  toggleColliders: () => set((s) => ({ showColliders: !s.showColliders })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleTrails: () => set((s) => ({ showTrails: !s.showTrails })),
  setCameraView: (cameraView) => set({ cameraView }),
  requestBaselineMatch: () =>
    set({ matchRequest: "start-baseline", playTrick: null, matchStatus: "idle", matchResult: null }),
  requestColorSeekMatch: () =>
    set({ matchRequest: "start-colorseek", playTrick: null, matchStatus: "idle", matchResult: null }),
  requestPlayTrick: (playTrick) =>
    set({ matchRequest: "start-trick", playTrick, matchStatus: "idle", matchResult: null }),
  abortMatch: () => set({ matchRequest: "abort" }),
  requestTableReset: () => set({ matchRequest: "reset" }),
  consumeMatchRequest: () => set({ matchRequest: "idle" }),
  setMatchRunning: () => set({ matchStatus: "running", matchResult: null }),
  finishMatch: (result) =>
    set({
      matchStatus: result.status === "completed" ? "completed" : "failed",
      matchResult: result,
    }),
}));
