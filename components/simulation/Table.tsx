"use client";

import { TABLE_CENTER_Y, TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "@/simulation/constants";

/** Static arena table — visual only; Rapier owns the collider. */
export function Table() {
  const w = TABLE_HALF_EXTENTS.x * 2;
  const h = TABLE_HALF_EXTENTS.y * 2;
  const d = TABLE_HALF_EXTENTS.z * 2;

  return (
    <group>
      <mesh position={[0, TABLE_CENTER_Y, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#323a46" metalness={0.16} roughness={0.54} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(w, d) * 0.42, Math.min(w, d) * 0.428, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {(
        [
          [-w / 2 + 0.05, d / 2 - 0.05],
          [w / 2 - 0.05, d / 2 - 0.05],
          [-w / 2 + 0.05, -d / 2 + 0.05],
          [w / 2 - 0.05, -d / 2 + 0.05],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, TABLE_CENTER_Y / 2, z]} castShadow>
          <boxGeometry args={[0.055, TABLE_CENTER_Y, 0.055]} />
          <meshStandardMaterial color="#1a1f26" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
