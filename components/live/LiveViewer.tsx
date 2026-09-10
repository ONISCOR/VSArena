"use client";

/** Read-only 3D mirror of the hosted harness. Assumption: no Rapier here — poses from /spectate. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { StudioEnv } from "@/components/simulation/StudioEnv";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import Link from "next/link";
import { ArenaSet } from "@/components/simulation/ArenaSet";
import { Blocks } from "@/components/simulation/Blocks";
import { RobotArm } from "@/components/simulation/RobotArm";
import { Table } from "@/components/simulation/Table";
import { TargetZone } from "@/components/simulation/TargetZone";
import type { SpectateFrameMessage, SpectateKind, SpectateMessage } from "@/lib/harness/spectate";
import { harnessHealthUrl, harnessSpectateUrl } from "@/lib/live/harnessWs";
import { TABLE_TOP_Y } from "@/simulation/constants";
import type { BlockState, JointState } from "@/simulation/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { fill } from "@/lib/i18n/messages";

type LiveStatus = "connecting" | "idle" | "live" | "result" | "error";

interface ResultBanner {
  agent: string;
  spatial: number;
  task: number;
}

const ZERO_JOINTS: JointState = {
  baseYaw: 0,
  shoulderPitch: 0.6,
  elbowPitch: -1.2,
  wristPitch: -0.4,
  gripper: 0,
};

/** Closer table rig — fills the frame like Studio, not a distant vignette. */
const CAM: [number, number, number] = [1.15, 1.05, 1.05];
const CAM_TARGET: [number, number, number] = [0.08, TABLE_TOP_Y + 0.1, 0];

/**
 * Full-bleed spectator stage: HUD overlays the canvas (no dead black band).
 *
 * @example <LiveViewer onCollapse={() => router.push("/simulation")} />
 */
export function LiveViewer({ onCollapse }: { onCollapse?: () => void }) {
  const { m } = useI18n();
  const copy = m.liveView;
  const jointsRef = useRef<JointState>({ ...ZERO_JOINTS });
  const blocksRef = useRef<BlockState[]>([]);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [feed, setFeed] = useState<SpectateKind | null>(null);
  const [evalWindow, setEvalWindow] = useState<string | null>(null);
  const [agent, setAgent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [taskScore, setTaskScore] = useState(0);
  const [mode, setMode] = useState<string | null>(null);
  const [result, setResult] = useState<ResultBanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const applyFrame = useCallback((frame: SpectateFrameMessage) => {
    jointsRef.current = { ...frame.joints };
    blocksRef.current = frame.blocks.map((b) => ({
      id: b.id,
      position: b.position,
      rotation: b.rotation,
      color: b.color,
    }));
    setAgent(frame.agent);
    setTick(frame.tick);
    setTaskScore(frame.task_completion_score);
    setMode(frame.mode);
    setFeed(frame.kind ?? "control");
    setEvalWindow(frame.eval_window ?? null);
    setStatus("live");
    setResult(null);
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      setStatus((s) => (s === "live" ? s : "connecting"));
      try {
        socket = new WebSocket(harnessSpectateUrl());
      } catch {
        setStatus("error");
        setError("Could not open spectator socket");
        return;
      }

      socket.onopen = () => {
        attempt = 0;
        if (!cancelled) setError(null);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let msg: SpectateMessage;
        try {
          msg = JSON.parse(String(event.data)) as SpectateMessage;
        } catch {
          return;
        }
        if (msg.type === "spectate_frame") {
          applyFrame(msg);
          return;
        }
        if (msg.type === "spectate_idle") {
          setStatus("idle");
          setAgent(null);
          setTick(0);
          setTaskScore(0);
          setMode(null);
          setFeed(null);
          setEvalWindow(null);
          return;
        }
        if (msg.type === "spectate_result") {
          setResult({
            agent: msg.agent,
            spatial: msg.scores.spatial_accuracy,
            task: msg.scores.task_completion_score,
          });
          if (msg.kind === "highlight") {
            setFeed("highlight");
            setEvalWindow(msg.eval_window ?? null);
            setStatus("live");
          } else {
            setStatus("result");
          }
          return;
        }
        if (msg.type === "spectate_error") {
          setStatus("error");
          setError(msg.message);
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setStatus("connecting");
        attempt += 1;
        retryTimer = setTimeout(connect, Math.min(12_000, 1500 * attempt));
      };
    };

    void fetch(harnessHealthUrl()).catch(() => undefined);
    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [applyFrame]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return copy.connecting;
      case "idle":
        return copy.waiting;
      case "live":
        return feed === "highlight" ? copy.reel : copy.live;
      case "result":
        return copy.finished;
      case "error":
        return copy.offline;
      default:
        return "";
    }
  }, [status, feed, copy]);

  const lead = useMemo(() => {
    if (feed === "highlight") return fill(copy.leadHighlight, { window: evalWindow ?? "—" });
    if (status === "live" || status === "result") return copy.leadControl;
    return copy.leadIdle;
  }, [copy, feed, evalWindow, status]);

  const taskPct = Math.round(taskScore * 100);

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-0 overflow-hidden bg-[#12151c] max-md:h-[calc(100dvh-6.75rem)]">
      {/* Full-bleed stage */}
      <div className="absolute inset-0">
        <Canvas
          className="h-full w-full"
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: CAM, fov: 36, near: 0.04, far: 18 }}
          onCreated={({ gl }) => {
            gl.setClearColor("#12151c", 1);
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.35;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <fog attach="fog" args={["#12151c", 8, 18]} />
          <StudioEnv />
          <hemisphereLight args={["#c5d0dc", "#1a1e26", 0.62]} />
          <ambientLight intensity={0.42} />
          <spotLight
            position={[1.8, 3.4, 1.7]}
            angle={0.62}
            penumbra={0.55}
            intensity={4.2}
            decay={0}
            color="#fff6ee"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0002}
          />
          <spotLight
            position={[-2.0, 2.8, 1.2]}
            angle={0.75}
            penumbra={0.8}
            intensity={1.8}
            decay={0}
            color="#b9d4ef"
          />
          <pointLight position={[0.15, 2.15, 0.1]} intensity={1.6} decay={0} color="#e8eef5" />
          <ArenaSet />
          <Table />
          <TargetZone />
          {ready ? (
            <>
              <RobotArm jointsRef={jointsRef} />
              <Blocks blocksRef={blocksRef} />
            </>
          ) : null}
          <ContactShadows position={[0, 0.002, 0]} opacity={0.32} scale={8} blur={2.4} far={2.6} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            target={CAM_TARGET}
            minDistance={0.85}
            maxDistance={3.2}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>
      </div>

      {/* Top HUD */}
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="pointer-events-auto flex max-w-md flex-col gap-2">
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              className="w-fit rounded-full border border-white/15 bg-[#07080b]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
            >
              {copy.back}
            </button>
          ) : null}
          <div className="rounded-2xl border border-white/[0.08] bg-[#07080b]/72 px-4 py-3 backdrop-blur-md">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-arena-cyan">
              {copy.kicker}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{copy.title}</h1>
            <p className="mt-1 text-xs leading-5 text-arena-muted sm:text-sm">{lead}</p>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur-md",
              status === "live" && feed === "highlight"
                ? "border-arena-cyan/30 bg-cyan-500/15 text-cyan-100"
                : status === "live"
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-[#07080b]/72 text-arena-muted",
            )}
          >
            {status === "live" ? (
              <span
                className={cn(
                  "h-2 w-2 animate-pulse rounded-full",
                  feed === "highlight" ? "bg-arena-cyan shadow-[0_0_8px_#22d3ee]" : "bg-emerald-400 shadow-[0_0_8px_#34d399]",
                )}
              />
            ) : (
              <span className="h-2 w-2 rounded-full bg-white/25" />
            )}
            {statusLabel}
          </div>
          {agent ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#07080b]/72 px-3 py-2 text-right text-xs backdrop-blur-md sm:text-sm">
              <p className="font-medium text-white">{agent}</p>
              <p className="mt-0.5 font-mono text-arena-muted">
                {mode ? `${mode} · ` : ""}tick {tick}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom HUD: task bar + hints */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-3">
          {status === "live" || status === "result" ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#07080b]/75 px-4 py-3 backdrop-blur-md">
              <div className="mb-1.5 flex items-center justify-between text-xs text-arena-muted">
                <span>{copy.task}</span>
                <span className="font-mono text-white">{taskPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-arena-cyan to-emerald-400 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, taskPct))}%` }}
                />
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border border-white/10 bg-[#07080b]/80 px-4 py-3 text-sm text-arena-muted backdrop-blur-md">
              {fill(copy.finishedLine, {
                agent: result.agent,
                spatial: (result.spatial * 100).toFixed(0),
                task: (result.task * 100).toFixed(0),
              })}{" "}
              <Link href="/leaderboard" className="text-arena-cyan hover:text-white">
                {copy.board}
              </Link>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90 backdrop-blur-md">
              {error}
            </p>
          ) : null}

          {status === "idle" || status === "connecting" ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#07080b]/75 px-4 py-3 text-sm text-arena-muted backdrop-blur-md">
              {status === "connecting" ? (
                <p>{copy.waking}</p>
              ) : (
                <p>
                  {copy.leadIdle}{" "}
                  <Link href="/account" className="text-arena-cyan hover:text-white">
                    {copy.key}
                  </Link>
                  {" · "}
                  <Link href="/submit" className="text-arena-cyan hover:text-white">
                    {copy.submit}
                  </Link>
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
