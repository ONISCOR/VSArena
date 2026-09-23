"use client";

import { TABLE_CENTER_Y, TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "@/simulation/constants";
import { useHallPalette } from "./palette";

interface BackdropCellProps {
  position: [number, number, number];
  rotationY?: number;
  pose?: number;
}

/**
 * Decorative neighboring work-cell. Visual only — no colliders.
 */
export function BackdropCell({ position, rotationY = 0, pose = 0 }: BackdropCellProps) {
  const p = useHallPalette();
  const w = TABLE_HALF_EXTENTS.x * 2 * 0.92;
  const h = TABLE_HALF_EXTENTS.y * 2;
  const d = TABLE_HALF_EXTENTS.z * 2 * 0.92;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, TABLE_CENTER_Y, 0]} receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#1a1d22"
          metalness={0.12}
          roughness={0.62}
          envMapIntensity={0.32}
        />
      </mesh>
      {(
        [
          [-w / 2 + 0.06, d / 2 - 0.06],
          [w / 2 - 0.06, d / 2 - 0.06],
          [-w / 2 + 0.06, -d / 2 + 0.06],
          [w / 2 - 0.06, -d / 2 + 0.06],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, TABLE_CENTER_Y / 2, z]}>
          <cylinderGeometry args={[0.026, 0.03, TABLE_CENTER_Y, 10]} />
          <meshStandardMaterial color={p.housing} metalness={0.45} roughness={0.4} />
        </mesh>
      ))}
      <InlineCobot pose={pose} />
      <Tote position={[0.32, TABLE_TOP_Y + 0.035, -0.16]} />
      <Tote position={[0.38, TABLE_TOP_Y + 0.028, 0.14]} small />
    </group>
  );
}

function InlineCobot({ pose }: { pose: number }) {
  const yaw = 0.55 + pose * 0.45;
  const shoulder = 0.92 + pose * 0.12;
  const elbow = -1.38 - pose * 0.18;
  const upper = 0.4;
  const fore = 0.32;
  return (
    <group position={[-0.16, TABLE_TOP_Y, 0.04]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.095, 0.04, 20]} />
        <meshStandardMaterial color="#16181c" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.048, 0.055, 0.14, 18]} />
        <meshStandardMaterial color="#16181c" metalness={0.55} roughness={0.35} />
      </mesh>
      <group position={[0, 0.18, 0]} rotation={[0, yaw, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.085, 16]} />
          <meshStandardMaterial color="#16181c" metalness={0.55} roughness={0.32} />
        </mesh>
        <group rotation={[0, 0, shoulder]}>
          <mesh position={[upper / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.034, upper, 14]} />
            <meshStandardMaterial
              color="#efeae2"
              emissive="#efeae2"
              emissiveIntensity={0.04}
              roughness={0.32}
              metalness={0.08}
            />
          </mesh>
          <group position={[upper, 0, 0]} rotation={[0, 0, elbow]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.075, 16]} />
              <meshStandardMaterial color="#16181c" metalness={0.55} roughness={0.32} />
            </mesh>
            <mesh position={[fore / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.024, 0.028, fore, 14]} />
              <meshStandardMaterial
                color="#efeae2"
                emissive="#efeae2"
                emissiveIntensity={0.03}
                roughness={0.32}
                metalness={0.08}
              />
            </mesh>
            <mesh position={[fore + 0.04, 0, 0]}>
              <boxGeometry args={[0.1, 0.05, 0.06]} />
              <meshStandardMaterial color="#1a1c20" metalness={0.45} roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function Tote({ position, small }: { position: [number, number, number]; small?: boolean }) {
  const p = useHallPalette();
  const s = small ? 0.085 : 0.12;
  return (
    <mesh position={position}>
      <boxGeometry args={[s, small ? 0.05 : 0.064, s * 0.72]} />
      <meshStandardMaterial color={p.crate} roughness={0.72} metalness={0.04} />
    </mesh>
  );
}
