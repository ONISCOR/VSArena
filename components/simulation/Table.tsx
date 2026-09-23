"use client";

import { TABLE_CENTER_Y, TABLE_HALF_EXTENTS } from "@/simulation/constants";
import { useTheme } from "@/lib/theme";

/** Static arena table — visual only; Rapier owns the collider. */
export function Table() {
  const light = useTheme().theme === "light";
  const w = TABLE_HALF_EXTENTS.x * 2;
  const h = TABLE_HALF_EXTENTS.y * 2;
  const d = TABLE_HALF_EXTENTS.z * 2;
  const top = light ? "#3a3f46" : "#2b323c";
  const edge = light ? "#2a2e34" : "#1c2128";
  const leg = light ? "#1c1f24" : "#101318";

  return (
    <group>
      <mesh position={[0, TABLE_CENTER_Y, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial
          color={top}
          metalness={0.22}
          roughness={0.42}
          clearcoat={0.18}
          clearcoatRoughness={0.55}
          envMapIntensity={0.85}
        />
      </mesh>
      <mesh position={[0, TABLE_CENTER_Y, d / 2 + 0.006]}>
        <boxGeometry args={[w + 0.012, h + 0.004, 0.012]} />
        <meshStandardMaterial color={edge} metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh position={[0, TABLE_CENTER_Y, -d / 2 - 0.006]}>
        <boxGeometry args={[w + 0.012, h + 0.004, 0.012]} />
        <meshStandardMaterial color={edge} metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh position={[w / 2 + 0.006, TABLE_CENTER_Y, 0]}>
        <boxGeometry args={[0.012, h + 0.004, d]} />
        <meshStandardMaterial color={edge} metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh position={[-w / 2 - 0.006, TABLE_CENTER_Y, 0]}>
        <boxGeometry args={[0.012, h + 0.004, d]} />
        <meshStandardMaterial color={edge} metalness={0.55} roughness={0.32} />
      </mesh>
      {(
        [
          [-w / 2 + 0.06, d / 2 - 0.06],
          [w / 2 - 0.06, d / 2 - 0.06],
          [-w / 2 + 0.06, -d / 2 + 0.06],
          [w / 2 - 0.06, -d / 2 + 0.06],
        ] as const
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, TABLE_CENTER_Y / 2, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.032, TABLE_CENTER_Y, 20]} />
            <meshStandardMaterial color={leg} metalness={0.55} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.012, 0]} receiveShadow>
            <cylinderGeometry args={[0.042, 0.042, 0.024, 20]} />
            <meshStandardMaterial color={leg} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
