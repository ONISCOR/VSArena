"use client";

import { BLOCK_TARGETS, CUBE_SIZE, TARGET_ZONE } from "@/simulation/constants";

const GHOSTS: Array<{ id: keyof typeof BLOCK_TARGETS; color: string }> = [
  { id: "block_cyan", color: "#00AEEF" },
  { id: "block_orange", color: "#F7941E" },
  { id: "block_magenta", color: "#E11D8F" },
];

/** Stack pad + translucent slot ghosts. Scoring uses 3D BLOCK_TARGETS, not this mesh. */
export function TargetZone() {
  const [x, y, z] = TARGET_ZONE.position;
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[TARGET_ZONE.radius - 0.008, TARGET_ZONE.radius, 48]} />
          <meshBasicMaterial color="#F7941E" transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <circleGeometry args={[TARGET_ZONE.radius - 0.01, 48]} />
          <meshBasicMaterial color="#F7941E" transparent opacity={0.08} />
        </mesh>
      </group>
      {GHOSTS.map((ghost) => {
        const slot = BLOCK_TARGETS[ghost.id];
        return (
          <mesh key={ghost.id} position={slot}>
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshStandardMaterial
              color={ghost.color}
              transparent
              opacity={0.1}
              roughness={0.22}
              metalness={0.08}
              emissive={ghost.color}
              emissiveIntensity={0.12}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
