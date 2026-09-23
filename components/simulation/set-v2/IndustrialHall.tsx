"use client";

import { BackdropCell } from "./BackdropCell";
import { useHallPalette } from "./palette";
import { useHallMaps } from "./textures";

const HALL_W = 14;
const HALL_D = 13;
const WALL_H = 4.55;
const CEIL_Y = 4.42;

/**
 * Semi-industrial bay around the live work-cell. No cage, no Rapier colliders.
 * `compact` is the PiP set: apron + tape only.
 */
export function IndustrialHall({ compact = false }: { compact?: boolean }) {
  const maps = useHallMaps();
  const floorW = compact ? 4.2 : HALL_W + 0.4;
  const floorD = compact ? 3.4 : HALL_D + 0.4;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial
          map={maps.concrete}
          roughnessMap={maps.concreteRough}
          bumpMap={maps.concreteRough}
          bumpScale={0.035}
          roughness={1}
          metalness={0.05}
          envMapIntensity={0.32}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0025, 0]} receiveShadow>
        <planeGeometry args={[1.58, 1.08]} />
        <meshStandardMaterial map={maps.slip} roughness={0.82} metalness={0.08} envMapIntensity={0.4} />
      </mesh>

      <SafetyTape map={maps.hazard} />
      {compact ? null : <CellStencil map={maps.stencil} />}

      {compact ? null : (
        <>
          <Walls plaster={maps.plaster} dado={maps.dado} />
          <Columns />
          <Ceiling />
          <HighBays />
          <Pendants />
          <Windows />
          <FloorProps />
          <BackdropCell position={[2.15, 0, -1.45]} rotationY={-0.62} pose={0.15} />
          <BackdropCell position={[1.05, 0, -2.55]} rotationY={0.22} pose={0.7} />
          <BackdropCell position={[-2.05, 0, -1.65]} rotationY={0.7} pose={-0.25} />
        </>
      )}
    </group>
  );
}

function Walls({ plaster, dado }: { plaster: ReturnType<typeof useHallMaps>["plaster"]; dado: ReturnType<typeof useHallMaps>["dado"] }) {
  const halfW = HALL_W / 2;
  const halfD = HALL_D / 2;
  const dadoH = 1.15;
  const upperH = WALL_H - dadoH;

  return (
    <group>
      <mesh position={[0, dadoH / 2, -halfD]}>
        <boxGeometry args={[HALL_W, dadoH, 0.12]} />
        <meshStandardMaterial map={dado} roughness={0.9} metalness={0.04} envMapIntensity={0.22} />
      </mesh>
      <mesh position={[0, dadoH + upperH / 2, -halfD]}>
        <boxGeometry args={[HALL_W, upperH, 0.1]} />
        <meshStandardMaterial map={plaster} roughness={0.92} metalness={0.03} envMapIntensity={0.2} />
      </mesh>

      <mesh position={[-halfW, WALL_H / 2, 0]}>
        <boxGeometry args={[0.12, WALL_H, HALL_D]} />
        <meshStandardMaterial map={plaster} roughness={0.92} metalness={0.03} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[halfW, WALL_H / 2, 0]}>
        <boxGeometry args={[0.12, WALL_H, HALL_D]} />
        <meshStandardMaterial map={plaster} roughness={0.92} metalness={0.03} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-halfW, dadoH / 2, 0]}>
        <boxGeometry args={[0.14, dadoH, HALL_D]} />
        <meshStandardMaterial map={dado} roughness={0.9} metalness={0.04} envMapIntensity={0.22} />
      </mesh>
      <mesh position={[halfW, dadoH / 2, 0]}>
        <boxGeometry args={[0.14, dadoH, HALL_D]} />
        <meshStandardMaterial map={dado} roughness={0.9} metalness={0.04} envMapIntensity={0.22} />
      </mesh>

      <mesh position={[0, WALL_H / 2, halfD]}>
        <boxGeometry args={[HALL_W, WALL_H, 0.1]} />
        <meshStandardMaterial map={plaster} roughness={0.94} metalness={0.03} envMapIntensity={0.18} />
      </mesh>
    </group>
  );
}

function Columns() {
  const p = useHallPalette();
  const posts: [number, number][] = [
    [-4.6, -4.4],
    [4.6, -4.4],
    [-4.6, 4.4],
    [4.6, 4.4],
  ];
  return (
    <group>
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, WALL_H / 2, 0]} castShadow>
            <boxGeometry args={[0.28, WALL_H, 0.28]} />
            <meshStandardMaterial color={p.steel} metalness={0.62} roughness={0.32} envMapIntensity={0.7} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.3, 0.28, 0.3]} />
            <meshStandardMaterial color={p.yellow} metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.42, 0.16, 0.42]} />
            <meshStandardMaterial color={p.beam} metalness={0.45} roughness={0.42} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ceiling() {
  const p = useHallPalette();
  const beams = [-4.4, -2.2, 0, 2.2, 4.4];
  return (
    <group>
      <mesh position={[0, CEIL_Y + 0.18, 0]}>
        <boxGeometry args={[HALL_W, 0.08, HALL_D]} />
        <meshStandardMaterial color={p.housing} roughness={1} metalness={0.08} />
      </mesh>
      {beams.map((x) => (
        <group key={x} position={[x, CEIL_Y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.045, 0.26, HALL_D - 0.4]} />
            <meshStandardMaterial color={p.beam} metalness={0.7} roughness={0.26} envMapIntensity={0.85} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow>
            <boxGeometry args={[0.18, 0.028, HALL_D - 0.4]} />
            <meshStandardMaterial color={p.steel} metalness={0.72} roughness={0.24} envMapIntensity={0.9} />
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <boxGeometry args={[0.18, 0.028, HALL_D - 0.4]} />
            <meshStandardMaterial color={p.steel} metalness={0.72} roughness={0.24} envMapIntensity={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, CEIL_Y - 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, HALL_W - 0.6, 0.08]} />
        <meshStandardMaterial color={p.steel} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[0, CEIL_Y - 0.22, -2.2]}>
        <boxGeometry args={[HALL_W - 1.2, 0.05, 0.22]} />
        <meshStandardMaterial color={p.housing} metalness={0.4} roughness={0.45} />
      </mesh>
    </group>
  );
}

function HighBays() {
  const spots: [number, number, number][] = [
    [0.15, CEIL_Y - 0.55, 0.08],
    [-2.85, CEIL_Y - 0.55, -2.55],
    [2.95, CEIL_Y - 0.55, -2.35],
    [2.9, CEIL_Y - 0.55, 1.4],
    [-2.7, CEIL_Y - 0.55, 1.55],
  ];
  return (
    <group>
      {spots.map((pos, i) => (
        <HighBay key={i} position={pos} />
      ))}
    </group>
  );
}

function HighBay({ position }: { position: [number, number, number] }) {
  const p = useHallPalette();
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshStandardMaterial color={p.steel} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.16, 0.2, 0.12, 16]} />
        <meshStandardMaterial color={p.housing} metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[0.14, 20]} />
        <meshStandardMaterial
          color={p.lamp}
          emissive={p.lamp}
          emissiveIntensity={p.light ? 2.4 : 4.2}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

function Pendants() {
  const p = useHallPalette();
  const lamps: [number, number, number][] = [
    [-1.55, 2.72, -1.28],
    [0.12, 2.68, -1.55],
    [1.62, 2.7, -1.22],
  ];
  return (
    <group>
      {lamps.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, (CEIL_Y - pos[1]) / 2, 0]}>
            <cylinderGeometry args={[0.01, 0.01, CEIL_Y - pos[1], 8]} />
            <meshStandardMaterial color={p.steel} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.13, 0.16, 0.1, 20]} />
            <meshStandardMaterial color={p.housing} metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}>
            <circleGeometry args={[0.11, 24]} />
            <meshStandardMaterial
              color={p.lamp}
              emissive={p.lamp}
              emissiveIntensity={p.light ? 2.4 : 3.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Windows() {
  const p = useHallPalette();
  const panes = [-3.6, -1.2, 1.2, 3.6];
  return (
    <group position={[0, 2.55, -HALL_D / 2 + 0.07]}>
      {panes.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.82, 1.48, 0.04]} />
            <meshStandardMaterial color={p.steel} metalness={0.65} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[1.62, 1.28, 0.03]} />
            <meshStandardMaterial
              color={p.window}
              emissive={p.window}
              emissiveIntensity={p.light ? 0.55 : 0.85}
              roughness={0.18}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.045, 1.28, 0.02]} />
            <meshStandardMaterial color={p.steel} metalness={0.65} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[1.62, 0.045, 0.02]} />
            <meshStandardMaterial color={p.steel} metalness={0.65} roughness={0.32} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SafetyTape({ map }: { map: ReturnType<typeof useHallMaps>["hazard"] }) {
  const hw = 0.92;
  const hd = 0.68;
  const t = 0.055;
  return (
    <group position={[0, 0.004, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, hd]}>
        <planeGeometry args={[hw * 2 + t, t]} />
        <meshBasicMaterial map={map} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -hd]}>
        <planeGeometry args={[hw * 2 + t, t]} />
        <meshBasicMaterial map={map} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[hw, 0, 0]}>
        <planeGeometry args={[hd * 2 + t, t]} />
        <meshBasicMaterial map={map} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-hw, 0, 0]}>
        <planeGeometry args={[hd * 2 + t, t]} />
        <meshBasicMaterial map={map} />
      </mesh>
    </group>
  );
}

function CellStencil({ map }: { map: ReturnType<typeof useHallMaps>["stencil"] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0.75]} position={[0.55, 0.01, 0.56]} scale={[-1, 1, 1]}>
      <planeGeometry args={[0.95, 0.26]} />
      <meshBasicMaterial map={map} transparent opacity={1} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

function FloorProps() {
  const p = useHallPalette();
  return (
    <group>
      <group position={[-3.55, 0, -2.35]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.42, 0.76, 0.32]} />
          <meshStandardMaterial color={p.housing} metalness={0.35} roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.78, 0]} castShadow>
          <boxGeometry args={[0.46, 0.04, 0.36]} />
          <meshStandardMaterial color={p.steel} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0.12, 0.92, 0]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.18]} />
          <meshStandardMaterial color={p.crate} roughness={0.7} />
        </mesh>
      </group>

      <group position={[3.65, 0, -2.55]} rotation={[0, -0.45, 0]}>
        <mesh position={[0, 0.07, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.12, 0.55]} />
          <meshStandardMaterial color={p.crate} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.62, 0.18, 0.48]} />
          <meshStandardMaterial color={p.crate} roughness={0.72} />
        </mesh>
        <mesh position={[-0.12, 0.42, 0.04]} castShadow>
          <boxGeometry args={[0.28, 0.22, 0.22]} />
          <meshStandardMaterial color={p.housing} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>

      <mesh position={[-4.1, 0.55, -3.2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
        <meshStandardMaterial color={p.steel} metalness={0.7} roughness={0.28} />
      </mesh>
    </group>
  );
}
