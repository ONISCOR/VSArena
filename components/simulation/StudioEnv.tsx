"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Local studio IBL (no HDRI download). Physical materials on the cobot pick this up.
 */
export function StudioEnv() {
  return (
    <Environment environmentIntensity={0.58} resolution={256}>
      <Lightformer intensity={2.6} position={[3.2, 5.2, 2.4]} scale={[7, 3.2, 1]} color="#fff3e6" />
      <Lightformer intensity={1.5} position={[-4.2, 2.8, 1.2]} scale={[6, 4, 1]} color="#c5d8f0" />
      <Lightformer intensity={0.85} position={[0.4, 1.2, -5]} scale={[10, 4, 1]} color="#ffd7b0" />
      <Lightformer
        intensity={1.35}
        position={[0, 7.5, 0]}
        rotation-x={Math.PI / 2}
        scale={[12, 12, 1]}
        color="#f4f7fb"
      />
    </Environment>
  );
}
