"use client";

/** Mini official-live preview (PiP). Assumption: click expands to full LiveViewer; one WS at a time. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ArenaSet } from "@/components/simulation/ArenaSet";
import { Blocks } from "@/components/simulation/Blocks";
import { RobotArm } from "@/components/simulation/RobotArm";
import { Table } from "@/components/simulation/Table";
import { TargetZone } from "@/components/simulation/TargetZone";
import type { SpectateFrameMessage, SpectateMessage } from "@/lib/harness/spectate";
import { harnessHealthUrl, harnessSpectateUrl } from "@/lib/live/harnessWs";
import { TABLE_TOP_Y } from "@/simulation/constants";
import type { BlockState, JointState } from "@/simulation/types";
import { cn } from "@/lib/utils";

const ZERO_JOINTS: JointState = {
  baseYaw: 0,
  shoulderPitch: 0.6,
  elbowPitch: -1.2,
  wristPitch: -0.4,
  gripper: 0,
};

/** Pull back + look at table center so the square frames the whole work-cell. */
const CAM: [number, number, number] = [1.9, 1.55, 1.75];
const CAM_TARGET: [number, number, number] = [0.08, TABLE_TOP_Y + 0.06, 0];

function PipCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...CAM);
    camera.lookAt(...CAM_TARGET);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

type PipStatus = "connecting" | "idle" | "live" | "error";

interface LivePipProps {
  label: string;
  onExpand: () => void;
}

/**
 * Bottom-right square preview of the hosted harness spectator.
 *
 * @example <LivePip label="Official live" onExpand={openLive} />
 */
export function LivePip({ label, onExpand }: LivePipProps) {
  const jointsRef = useRef<JointState>({ ...ZERO_JOINTS });
  const blocksRef = useRef<BlockState[]>([]);
  const [status, setStatus] = useState<PipStatus>("connecting");
  const [agent, setAgent] = useState<string | null>(null);
  const [reel, setReel] = useState(false);
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
    setStatus("live");
    setReel(frame.kind === "highlight");
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
        return;
      }
      socket.onopen = () => {
        attempt = 0;
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
        if (msg.type === "spectate_idle" || (msg.type === "spectate_result" && msg.kind !== "highlight")) {
          setStatus("idle");
          setAgent(null);
          setReel(false);
          return;
        }
        if (msg.type === "spectate_error") setStatus("error");
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

  const live = status === "live";

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`${label} — expand`}
      className={cn(
        "group pointer-events-auto relative h-[9.5rem] w-[9.5rem] overflow-hidden rounded-xl border text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition",
        "border-white/15 bg-[#0c0e12] hover:border-emerald-400/40 hover:ring-1 hover:ring-emerald-400/25",
        live && (reel ? "border-cyan-400/35" : "border-emerald-400/35"),
      )}
    >
      <div className="absolute inset-0">
        <Canvas
          className="h-full w-full"
          dpr={[1, 1.25]}
          gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
          camera={{ position: CAM, fov: 46, near: 0.1, far: 24 }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor("#12151c", 1);
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.25;
            gl.outputColorSpace = SRGBColorSpace;
            camera.lookAt(...CAM_TARGET);
          }}
        >
          <PipCamera />
          <ambientLight intensity={0.7} />
          <hemisphereLight args={["#c5d0dc", "#1a1e26", 0.8]} />
          <spotLight position={[1.6, 2.8, 1.4]} angle={0.7} penumbra={0.5} intensity={3.2} decay={0} color="#fff6ee" />
          <ArenaSet />
          <Table />
          <TargetZone />
          {ready ? (
            <>
              <RobotArm jointsRef={jointsRef} />
              <Blocks blocksRef={blocksRef} />
            </>
          ) : null}
          <ContactShadows position={[0, 0.002, 0]} opacity={0.28} scale={6} blur={2} far={2} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1 bg-gradient-to-b from-black/70 to-transparent p-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            live ? (reel ? "bg-cyan-500/25 text-cyan-100" : "bg-emerald-500/25 text-emerald-200") : "bg-white/10 text-arena-muted",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              live ? (reel ? "animate-pulse bg-arena-cyan" : "animate-pulse bg-emerald-400") : "bg-white/30",
            )}
          />
          {live ? (reel ? "REEL" : "LIVE") : status === "connecting" ? "…" : "Idle"}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pb-2 pt-6">
        <p className="text-[11px] font-medium leading-tight text-white">{label}</p>
        <p className="mt-0.5 truncate text-[10px] text-arena-muted">
          {agent ?? (live ? "Official harness" : "Tap to expand")}
        </p>
      </div>
    </button>
  );
}
