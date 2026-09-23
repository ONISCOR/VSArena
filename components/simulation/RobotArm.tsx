"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import {
  ARM_MOUNT,
  GRASP_DEPTH,
  JAW_MAX_SEP,
  JAW_MIN_SEP,
  JAW_THICKNESS,
  L_FOREARM,
  L_UPPER,
  L_WRIST,
  PEDESTAL_H,
  PEDESTAL_R,
} from "@/simulation/constants";
import type { JointState } from "@/simulation/types";

const WHITE = "#e6e1d8";
const BLACK = "#16181c";
const METAL = "#9aa3ab";
const RUBBER = "#1a1a1c";
const GRAPHITE = "#2a2c31";

/** Visual only. Sized so white shells nest inside the cans and do not meet outside them. */
const J_SHOULDER = { r: 0.038, w: 0.072 };
const J_ELBOW = { r: 0.042, w: 0.066 };
const J_WRIST = { r: 0.028, w: 0.054 };
const NEST = 0.015;
const CUFF = 0.008;

interface RobotArmProps {
  jointsRef: MutableRefObject<JointState>;
}

/**
 * Visual Panda-style cobot driven by the same nested 4-DOF FK as physics.
 * Shells nest inside joint cans; they never meet in open air so orbiting stays clean.
 */
export function RobotArm({ jointsRef }: RobotArmProps) {
  const yaw = useRef<Group>(null);
  const shoulder = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  const wrist = useRef<Group>(null);
  const jawLeft = useRef<Group>(null);
  const jawRight = useRef<Group>(null);

  useFrame(() => {
    const j = jointsRef.current;
    if (yaw.current) yaw.current.rotation.y = j.baseYaw;
    if (shoulder.current) shoulder.current.rotation.z = j.shoulderPitch;
    if (elbow.current) elbow.current.rotation.z = j.elbowPitch;
    if (wrist.current) wrist.current.rotation.z = j.wristPitch;
    const close = j.gripper * j.gripper * (3 - 2 * j.gripper);
    const sep = JAW_MIN_SEP / 2 + ((JAW_MAX_SEP - JAW_MIN_SEP) / 2) * (1 - close);
    const tilt = close * 0.07;
    if (jawLeft.current) {
      jawLeft.current.position.set(0.022, 0, sep);
      jawLeft.current.rotation.set(0, -tilt, 0);
    }
    if (jawRight.current) {
      jawRight.current.position.set(0.022, 0, -sep);
      jawRight.current.rotation.set(0, tilt, 0);
    }
  });

  return (
    <group position={ARM_MOUNT}>
      <mesh position={[0, -0.006, 0]} receiveShadow>
        <cylinderGeometry args={[PEDESTAL_R + 0.016, PEDESTAL_R + 0.026, 0.036, 40]} />
        <PandaBlack />
      </mesh>
      <Bolts y={0.014} radius={PEDESTAL_R + 0.006} count={8} />
      <mesh position={[0, 0.037, 0]} castShadow>
        <cylinderGeometry args={[0.044, PEDESTAL_R - 0.002, 0.066, 36]} />
        <PandaBlack />
      </mesh>
      <mesh position={[0, 0.068, 0]} castShadow>
        <cylinderGeometry args={[0.046, 0.046, 0.007, 36]} />
        <PandaMetal />
      </mesh>

      <group ref={yaw} position={[0, PEDESTAL_H, 0]}>
        <JointCan radius={J_SHOULDER.r} width={J_SHOULDER.w} />
        <group ref={shoulder}>
          <Link
            length={L_UPPER}
            rStart={0.026}
            rEnd={0.023}
            padStart={NEST}
            padEnd={NEST}
            cuffStart={J_SHOULDER.r}
            cuffEnd={J_ELBOW.r}
          />
          <Conduit length={L_UPPER} pad={NEST + 0.028} lift={0.022} />

          <group ref={elbow} position={[L_UPPER, 0, 0]}>
            <JointCan radius={J_ELBOW.r} width={J_ELBOW.w} />
            <Link
              length={L_FOREARM}
              rStart={0.022}
              rEnd={0.019}
              padStart={NEST}
              padEnd={NEST}
              cuffStart={J_ELBOW.r}
              cuffEnd={J_WRIST.r}
            />
            <Conduit length={L_FOREARM} pad={NEST + 0.026} lift={-0.018} graphite />

            <group ref={wrist} position={[L_FOREARM, 0, 0]}>
              <JointCan radius={J_WRIST.r} width={J_WRIST.w} />
              <Link
                length={L_WRIST}
                rStart={0.015}
                rEnd={0.013}
                padStart={NEST}
                padEnd={0.002}
                cuffStart={J_WRIST.r}
                cuffEnd={0}
                dark
              />
              <group position={[L_WRIST, 0, 0]}>
                <Tool />
                <Jaw groupRef={jawLeft} innerSign={-1} />
                <Jaw groupRef={jawRight} innerSign={1} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Tool() {
  const railZ = JAW_MAX_SEP + 0.01;
  return (
    <group>
      <mesh position={[-0.006, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.019, 0.016, 0.02, 28]} />
        <PandaBlack />
      </mesh>
      <RoundedBox args={[0.064, 0.05, 0.058]} radius={0.004} smoothness={4} position={[0.01, 0, 0]} castShadow>
        <PandaGraphite />
      </RoundedBox>
      <mesh position={[0.024, 0.02, 0]} castShadow>
        <boxGeometry args={[0.038, 0.007, railZ]} />
        <PandaMetal />
      </mesh>
      <mesh position={[0.024, -0.02, 0]} castShadow>
        <boxGeometry args={[0.038, 0.007, railZ]} />
        <PandaMetal />
      </mesh>
      <mesh position={[0.024, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0026, 0.0026, railZ * 0.9, 10]} />
        <PandaBlack />
      </mesh>
      <mesh position={[0.024, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0026, 0.0026, railZ * 0.9, 10]} />
        <PandaBlack />
      </mesh>
      <RoundedBox args={[0.018, 0.03, 0.04]} radius={0.003} smoothness={3} position={[0.038, 0, 0]} castShadow>
        <PandaBlack />
      </RoundedBox>
      <mesh position={[GRASP_DEPTH, 0, 0]}>
        <sphereGeometry args={[0.0045, 12, 12]} />
        <meshBasicMaterial color="#f4fbff" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function PandaWhite() {
  return <meshPhysicalMaterial color={WHITE} metalness={0.05} roughness={0.38} clearcoat={0.42} clearcoatRoughness={0.28} envMapIntensity={1.05} />;
}

function PandaBlack() {
  return <meshPhysicalMaterial color={BLACK} metalness={0.62} roughness={0.36} clearcoat={0.08} clearcoatRoughness={0.5} />;
}

function PandaMetal() {
  return <meshPhysicalMaterial color={METAL} metalness={0.9} roughness={0.2} envMapIntensity={1.2} />;
}

function PandaGraphite() {
  return <meshPhysicalMaterial color={GRAPHITE} metalness={0.42} roughness={0.4} />;
}

function JointCan({ radius, width }: { radius: number; width: number }) {
  const rim = 0.011;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.88, radius * 0.88, width - rim * 2, 36]} />
        <PandaBlack />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, width / 2 - rim / 2]} castShadow>
        <cylinderGeometry args={[radius, radius, rim, 36]} />
        <PandaBlack />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -(width / 2 - rim / 2)]} castShadow>
        <cylinderGeometry args={[radius, radius, rim, 36]} />
        <PandaBlack />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, width / 2 + 0.002]} castShadow>
        <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.004, 28]} />
        <PandaMetal />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -(width / 2 + 0.002)]} castShadow>
        <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.004, 28]} />
        <PandaMetal />
      </mesh>
    </group>
  );
}

function Link({
  length,
  rStart,
  rEnd,
  padStart,
  padEnd,
  cuffStart,
  cuffEnd,
  dark,
}: {
  length: number;
  rStart: number;
  rEnd: number;
  padStart: number;
  padEnd: number;
  cuffStart: number;
  cuffEnd: number;
  dark?: boolean;
}) {
  const x0 = padStart;
  const x1 = length - padEnd;
  const span = Math.max(0.024, x1 - x0);
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.78, 1, 1]} castShadow>
        <cylinderGeometry args={[rEnd, rStart, span, 32]} />
        {dark ? <PandaBlack /> : <PandaWhite />}
      </mesh>
      <mesh position={[cuffStart + CUFF / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[rStart + 0.003, rStart + 0.0015, CUFF, 24]} />
        <PandaBlack />
      </mesh>
      <mesh position={[length - cuffEnd - CUFF / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[rEnd + 0.0015, rEnd + 0.003, CUFF, 24]} />
        <PandaBlack />
      </mesh>
    </group>
  );
}

function Conduit({ length, pad, lift, graphite }: { length: number; pad: number; lift: number; graphite?: boolean }) {
  const span = Math.max(0.04, length - pad * 2);
  return (
    <mesh position={[length / 2, lift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      {graphite ? <boxGeometry args={[0.009, span, 0.014]} /> : <cylinderGeometry args={[0.0055, 0.0055, span, 10]} />}
      {graphite ? <PandaGraphite /> : <PandaBlack />}
    </mesh>
  );
}

function Bolts({ y, radius, count = 6 }: { y: number; radius: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]} castShadow>
            <cylinderGeometry args={[0.0048, 0.0048, 0.008, 8]} />
            <PandaMetal />
          </mesh>
        );
      })}
    </>
  );
}

function Jaw({ groupRef, innerSign }: { groupRef: MutableRefObject<Group | null>; innerSign: number }) {
  const padT = 0.006;
  const inner = innerSign * (JAW_THICKNESS * 0.36 + padT / 2);
  return (
    <group ref={groupRef}>
      <RoundedBox args={[0.03, 0.04, 0.022]} radius={0.003} smoothness={4} position={[0, 0, 0]} castShadow>
        <PandaMetal />
      </RoundedBox>
      <mesh position={[0.014, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.012, 16]} />
        <PandaBlack />
      </mesh>
      <RoundedBox args={[0.058, 0.03, 0.011]} radius={0.003} smoothness={4} position={[0.044, 0, 0]} castShadow>
        <PandaGraphite />
      </RoundedBox>
      <RoundedBox args={[0.02, 0.026, 0.01]} radius={0.004} smoothness={4} position={[0.08, 0, 0]} castShadow>
        <PandaBlack />
      </RoundedBox>
      <RoundedBox args={[0.046, 0.022, padT]} radius={0.002} smoothness={3} position={[0.054, 0, inner]} castShadow>
        <meshPhysicalMaterial color={RUBBER} metalness={0.02} roughness={0.94} />
      </RoundedBox>
      {[-0.014, 0, 0.014].map((dx) => (
        <mesh key={dx} position={[0.054 + dx, 0, inner + innerSign * 0.0014]} castShadow>
          <boxGeometry args={[0.0036, 0.018, 0.0018]} />
          <meshPhysicalMaterial color="#121010" metalness={0.02} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}
