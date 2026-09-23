"use client";

import { Environment, Lightformer, ContactShadows, SoftShadows } from "@react-three/drei";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color, Fog } from "three";
import { useTheme } from "@/lib/theme";

/**
 * Warehouse IBL — cooler ceiling wash, warm window bounce. No photography cyan.
 */
export function IndustrialEnv() {
  const light = useTheme().theme === "light";
  return (
    <Environment environmentIntensity={light ? 0.74 : 0.55} resolution={384}>
      <Lightformer
        intensity={light ? 3.1 : 2.6}
        position={[0, 6.2, 0]}
        rotation-x={Math.PI / 2}
        scale={[18, 14, 1]}
        color="#eef2f6"
      />
      <Lightformer intensity={light ? 2.1 : 1.55} position={[6.4, 2.8, -3.2]} scale={[1.2, 5.5, 1]} color="#ffd7a8" />
      <Lightformer intensity={light ? 1.4 : 1.05} position={[-6.2, 2.4, 1.4]} scale={[1.4, 4.8, 1]} color="#c5d4e4" />
      <Lightformer intensity={0.7} position={[0, 2.2, -7]} scale={[12, 3, 1]} color="#b7c4d2" />
    </Environment>
  );
}

/**
 * High-bay key on the live cell, sodium fill on the bay, factory fog.
 * `compact` drops soft shadows and bay fills for the PiP canvas.
 */
export function IndustrialLook({ compact = false }: { compact?: boolean }) {
  const theme = useTheme().theme;
  const { gl, scene } = useThree();
  const light = theme === "light";
  const clear = light ? "#c8c0b4" : "#1a1e24";
  const fog = light ? "#c2bbb0" : "#1c222a";

  useEffect(() => {
    const bg = new Color(clear);
    gl.setClearColor(bg, 1);
    gl.toneMappingExposure = light ? 1.12 : 1.24;
    scene.background = bg;
    scene.fog = compact ? null : new Fog(fog, light ? 14 : 11, light ? 34 : 28);
  }, [clear, compact, fog, gl, light, scene]);

  if (compact) {
    return (
      <>
        <hemisphereLight args={light ? ["#efe8dc", "#7d766c", 0.55] : ["#8ea0b4", "#1a1e24", 0.42]} />
        <ambientLight intensity={light ? 0.28 : 0.16} />
        <spotLight
          position={[0.35, 2.4, 0.85]}
          angle={0.55}
          penumbra={0.5}
          intensity={light ? 5.4 : 7.2}
          decay={0}
          color="#fff4e4"
        />
        <ContactShadows position={[0, 0.001, 0]} opacity={light ? 0.32 : 0.48} scale={4.2} blur={2.2} far={1.8} />
      </>
    );
  }

  return (
    <>
      <SoftShadows samples={8} size={14} focus={0.72} />
      <hemisphereLight args={light ? ["#efe8dc", "#7d766c", 0.52] : ["#8ea0b4", "#1a1e24", 0.38]} />
      <ambientLight intensity={light ? 0.22 : 0.12} />
      <spotLight
        position={[0.18, 3.05, 0.28]}
        angle={0.34}
        penumbra={0.42}
        intensity={light ? 7.2 : 10.4}
        decay={0}
        color="#fff4e4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00032}
        shadow-normalBias={0.02}
      />
      <spotLight
        position={[-2.4, 3.55, -2.1]}
        angle={0.78}
        penumbra={0.88}
        intensity={light ? 1.15 : 1.45}
        decay={0}
        color="#ffd9a0"
      />
      <spotLight
        position={[2.7, 3.55, -1.9]}
        angle={0.78}
        penumbra={0.88}
        intensity={light ? 1.05 : 1.25}
        decay={0}
        color="#d7e4f2"
      />
      <spotLight
        position={[2.5, 3.4, 1.2]}
        angle={0.7}
        penumbra={0.9}
        intensity={light ? 0.7 : 0.85}
        decay={0}
        color="#f0e6d4"
      />
      <pointLight position={[0.08, 2.15, 0.06]} intensity={light ? 0.7 : 1.05} decay={2} distance={2.4} color="#fff6e8" />
      <ContactShadows position={[0, 0.001, 0]} opacity={light ? 0.38 : 0.56} scale={7.5} blur={1.9} far={2.6} />
    </>
  );
}
