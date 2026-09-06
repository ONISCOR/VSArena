"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Line } from "@react-three/drei";
import { StudioEnv } from "@/components/simulation/StudioEnv";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { TABLE_TOP_Y } from "@/simulation/constants";
import { ArenaScene } from "@/components/simulation/ArenaScene";
import { ClipRecorder } from "@/components/simulation/ClipRecorder";
import { useHudStore, type CameraView } from "@/lib/store";

interface RigPose {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  enablePan: boolean;
}

const TABLE_TARGET: [number, number, number] = [0.08, TABLE_TOP_Y + 0.08, 0];

const CAMERA_RIGS: Record<CameraView, RigPose> = {
  orbit: {
    position: [1.72, 1.18, 1.55],
    target: TABLE_TARGET,
    minDistance: 0.95,
    maxDistance: 4.2,
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
};

/**
 * Per-view orbit rig. `table` locks the pivot to the work surface and allows full 360° yaw.
 *
 * @example <CameraRig />
 */
function CameraRig() {
  const view = useHudStore((s) => s.cameraView);
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const rig = CAMERA_RIGS[view];

  useEffect(() => {
    camera.position.set(...rig.position);
    controls.current?.target.set(...rig.target);
    controls.current?.update();
  }, [camera, rig]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={rig.enablePan}
      minDistance={rig.minDistance}
      maxDistance={rig.maxDistance}
      minPolarAngle={rig.minPolarAngle}
      maxPolarAngle={rig.maxPolarAngle}
      target={rig.target}
    />
  );
}

function TcpTrailLine() {
  const enabled = useHudStore((s) => s.showTrails);
  const points = useHudStore((s) => s.tcpTrail);
  if (!enabled || points.length < 2) return null;
  return <Line points={points} color="#00AEEF" lineWidth={1.2} transparent opacity={0.65} />;
}

/** R3F canvas. Parent must provide a sized box; physics stays in /simulation. */
export function ArenaCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: CAMERA_RIGS.orbit.position, fov: 38, near: 0.04, far: 18 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#12151c", 1);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.35;
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      <fog attach="fog" args={["#12151c", 10, 22]} />
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
        shadow-bias={-0.0008}
      />
      <spotLight position={[-2.0, 2.8, 1.2]} angle={0.75} penumbra={0.8} intensity={1.8} decay={0} color="#b9d4ef" />
      <pointLight position={[0.15, 2.15, 0.1]} intensity={1.6} decay={0} distance={0} color="#e8eef5" />
      <directionalLight position={[-1.6, 2.2, -2.0]} intensity={0.85} color="#f0d2aa" />
      <ArenaScene />
      <ClipRecorder />
      <TcpTrailLine />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.32} scale={8} blur={2.4} far={2.6} />
      <CameraRig />
    </Canvas>
  );
}
