"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { IndustrialEnv, IndustrialLook } from "@/components/simulation/set-v2";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ACESFilmicToneMapping, MathUtils, Spherical, SRGBColorSpace, Vector3 } from "three";
import { TABLE_TOP_Y } from "@/simulation/constants";
import { ArenaScene } from "@/components/simulation/ArenaScene";
import { useHudStore, type CameraView } from "@/lib/store";

interface RigPose {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  enablePan: boolean;
  fov?: number;
}

const TABLE_TARGET: [number, number, number] = [0.08, TABLE_TOP_Y + 0.08, 0];

/** Snappy orbit cut between presets (seconds). */
const CAMERA_BLEND_S = 0.48;

const CAMERA_RIGS: Record<CameraView, RigPose> = {
  orbit: {
    position: [2.08, 1.38, 1.88],
    target: TABLE_TARGET,
    minDistance: 0.95,
    maxDistance: 5.4,
    minPolarAngle: 0.18,
    maxPolarAngle: Math.PI / 2 - 0.12,
    enablePan: true,
  },
  table: {
    position: [1.05, 1.12, 0.98],
    target: TABLE_TARGET,
    minDistance: 0.78,
    maxDistance: 1.55,
    minPolarAngle: 0.22,
    maxPolarAngle: Math.PI / 2 - 0.08,
    enablePan: false,
  },
  top: {
    position: [0.08, 2.85, 0.04],
    target: [0.08, TABLE_TOP_Y, 0],
    minDistance: 1.8,
    maxDistance: 3.6,
    minPolarAngle: 0,
    maxPolarAngle: 0.4,
    enablePan: true,
  },
  side: {
    position: [0.12, 0.98, 1.85],
    target: [0.08, 0.82, 0],
    minDistance: 1.1,
    maxDistance: 3.2,
    minPolarAngle: 0.25,
    maxPolarAngle: Math.PI / 2 - 0.1,
    enablePan: true,
  },
  play: {
    position: [1.58, 1.55, 1.42],
    target: [0.12, TABLE_TOP_Y + 0.36, 0],
    minDistance: 1.25,
    maxDistance: 2.45,
    minPolarAngle: 0.3,
    maxPolarAngle: Math.PI / 2 - 0.14,
    enablePan: false,
    fov: 42,
  },
};

/** Fast settle — punchy start, soft landing. */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function shortestAngle(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Orbit-style cut: sway around the look target instead of a straight lerp through the cell.
 */
function CameraRig() {
  const view = useHudStore((s) => s.cameraView);
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const rig = CAMERA_RIGS[view];
  const [cutting, setCutting] = useState(false);

  const fromSph = useRef(new Spherical());
  const toSph = useRef(new Spherical());
  const fromTarget = useRef(new Vector3());
  const toTarget = useRef(new Vector3());
  const offset = useRef(new Vector3());
  const scratch = useRef(new Vector3());
  const fromFov = useRef(34);
  const toFov = useRef(34);
  const blend = useRef(1);
  const prevView = useRef<CameraView | null>(null);

  useEffect(() => {
    const next = CAMERA_RIGS[view];
    toTarget.current.set(...next.target);
    toFov.current = next.fov ?? 34;
    offset.current.set(...next.position).sub(toTarget.current);
    toSph.current.setFromVector3(offset.current);
    toSph.current.makeSafe();

    if (prevView.current === null) {
      camera.position.set(...next.position);
      if ("fov" in camera) {
        camera.fov = toFov.current;
        camera.updateProjectionMatrix();
      }
      controls.current?.target.copy(toTarget.current);
      controls.current?.update();
      prevView.current = view;
      blend.current = 1;
      setCutting(false);
      return;
    }

    if (prevView.current === view) return;

    const pivot = controls.current?.target ?? toTarget.current;
    fromTarget.current.copy(pivot);
    offset.current.copy(camera.position).sub(pivot);
    fromSph.current.setFromVector3(offset.current);
    fromSph.current.makeSafe();
    // Keep a minimum radius so top↔side never collapses through the table.
    fromSph.current.radius = Math.max(0.55, fromSph.current.radius);
    toSph.current.radius = Math.max(0.55, toSph.current.radius);
    fromFov.current = "fov" in camera ? camera.fov : 34;
    blend.current = 0;
    setCutting(true);
    prevView.current = view;
  }, [camera, view]);

  useFrame((_, dt) => {
    const ctrl = controls.current;
    if (!ctrl || blend.current >= 1) return;

    blend.current = Math.min(1, blend.current + dt / CAMERA_BLEND_S);
    const t = easeOutQuint(blend.current);

    const theta = fromSph.current.theta + shortestAngle(fromSph.current.theta, toSph.current.theta) * t;
    const phi = MathUtils.lerp(fromSph.current.phi, toSph.current.phi, t);
    // Slight radius ease with a tiny outward kick mid-cut for energy.
    const kick = Math.sin(t * Math.PI) * 0.08;
    const radius = MathUtils.lerp(fromSph.current.radius, toSph.current.radius, t) + kick;

    ctrl.target.lerpVectors(fromTarget.current, toTarget.current, t);
    scratch.current.setFromSphericalCoords(radius, phi, theta);
    camera.position.copy(ctrl.target).add(scratch.current);

    if ("fov" in camera) {
      // Soft FOV settle — no big zoom punch that feels gimmicky.
      camera.fov = MathUtils.lerp(fromFov.current, toFov.current, t);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(ctrl.target);
    ctrl.update();

    if (blend.current >= 1) {
      camera.position.set(...CAMERA_RIGS[view].position);
      ctrl.target.set(...CAMERA_RIGS[view].target);
      if ("fov" in camera) {
        camera.fov = CAMERA_RIGS[view].fov ?? 34;
        camera.updateProjectionMatrix();
      }
      ctrl.update();
      setCutting(false);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      enablePan={rig.enablePan && !cutting}
      enableRotate={!cutting}
      enableZoom={!cutting}
      minDistance={rig.minDistance}
      maxDistance={rig.maxDistance}
      minPolarAngle={rig.minPolarAngle}
      maxPolarAngle={rig.maxPolarAngle}
    />
  );
}

function TcpTrailLine() {
  const enabled = useHudStore((s) => s.showTrails);
  const points = useHudStore((s) => s.tcpTrail);
  if (!enabled || points.length < 2) return null;
  return <Line points={points} color="#3EE0EA" lineWidth={1.35} transparent opacity={0.7} />;
}

/** R3F canvas. Parent must provide a sized box; physics stays in /simulation. */
export function ArenaCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      aria-label="Work-cell"
      fallback={null}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: CAMERA_RIGS.orbit.position, fov: 34, near: 0.04, far: 42 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.22;
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      <IndustrialEnv />
      <IndustrialLook />
      <ArenaScene />
      <TcpTrailLine />
      <CameraRig />
    </Canvas>
  );
}
