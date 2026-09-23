// Assumption: Rapier WASM is initialized once per ArenaSimulation.create(); physics never runs on the server.

import RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { forwardKinematics } from "./armKinematics";
import {
  BLOCK_SPAWNS,
  CUBE_HALF,
  DEFAULT_JOINTS,
  FIXED_DT,
  FLOOR_HALF_EXTENTS,
  GRASP_CLOSE_THRESHOLD,
  GRASP_OPEN_THRESHOLD,
  GRAVITY_Y,
  GRIPPER_SPEED,
  JAW_HEIGHT,
  JAW_LENGTH,
  JAW_MAX_SEP,
  JAW_MIN_SEP,
  JAW_THICKNESS,
  GRASP_DEPTH,
  JOINT_LIMITS,
  JOINT_SPEED,
  MAX_SUBSTEPS,
  TABLE_CENTER_Y,
  TABLE_HALF_EXTENTS,
  TABLE_TOP_Y,
  TABLE_WALLS,
  type BlockSpawnDesc,
} from "./constants";
import { attachBlockToGripper, findGraspTarget, followGripper, releaseHeldBlock } from "./grasp";
import { KEY_BINDINGS } from "./input";
import { clamp, cloneJoints, moveToward, quatSlerp, vecLerp } from "./math";
import { armClearsTable, GROUPS_ARM, GROUPS_BLOCK, GROUPS_BLOCK_HELD, GROUPS_STATIC, minBlockCenterY } from "./tableBounds";
import type {
  AgentCommand,
  ArmSnapshot,
  BlockState,
  DebugBox,
  InputBuffer,
  JointState,
  Pose,
  SimEvent,
  SimulationSnapshot,
} from "./types";

function poseFromRapier(body: RigidBody): Pose {
  const t = body.translation();
  const r = body.rotation();
  return {
    position: [t.x, t.y, t.z],
    rotation: [r.x, r.y, r.z, r.w],
  };
}

function lerpPose(a: Pose, b: Pose, alpha: number): Pose {
  return {
    position: vecLerp(a.position, b.position, alpha),
    rotation: quatSlerp(a.rotation, b.rotation, alpha),
  };
}

function lerpArm(a: ArmSnapshot, b: ArmSnapshot, alpha: number): ArmSnapshot {
  return {
    pedestal: lerpPose(a.pedestal, b.pedestal, alpha),
    shoulder: lerpPose(a.shoulder, b.shoulder, alpha),
    upperArm: lerpPose(a.upperArm, b.upperArm, alpha),
    elbow: lerpPose(a.elbow, b.elbow, alpha),
    forearm: lerpPose(a.forearm, b.forearm, alpha),
    wrist: lerpPose(a.wrist, b.wrist, alpha),
    palm: lerpPose(a.palm, b.palm, alpha),
    jawLeft: lerpPose(a.jawLeft, b.jawLeft, alpha),
    jawRight: lerpPose(a.jawRight, b.jawRight, alpha),
    tcp: lerpPose(a.tcp, b.tcp, alpha),
  };
}

/**
 * Client-side Rapier world: kinematic 5-DOF arm + dynamic blocks + kinematic grasp.
 */
export class ArenaSimulation {
  private world: World;
  private gripperBody!: RigidBody;
  private jawLeftCollider!: Collider;
  private jawRightCollider!: Collider;
  private blockBodies = new Map<string, RigidBody>();
  private graspedBlockId: string | null = null;
  private joints: JointState = cloneJoints(DEFAULT_JOINTS);
  private gripperTarget = 0;
  private accumulator = 0;
  private tick = 0;
  private prev!: SimulationSnapshot;
  private curr!: SimulationSnapshot;
  private events: SimEvent[] = [];
  private agentCommand: AgentCommand | null = null;
  private readonly spawns: readonly BlockSpawnDesc[];

  private constructor(world: World, spawns: readonly BlockSpawnDesc[]) {
    this.world = world;
    this.spawns = spawns;
    this.rebuildScene();
  }

  /**
   * Load Rapier WASM then construct a fresh arena.
   */
  static async create(options?: { spawns?: readonly BlockSpawnDesc[] }): Promise<ArenaSimulation> {
    await RAPIER.init();
    const world = new RAPIER.World({ x: 0, y: GRAVITY_Y, z: 0 });
    world.timestep = FIXED_DT;
    const spawns = options?.spawns ?? BLOCK_SPAWNS;
    return new ArenaSimulation(world, spawns);
  }

  /** Drain sim events (grasp / release / reset / panic) for the HUD log. */
  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /**
   * Advance physics with a fixed 60 Hz step. Returns interpolation alpha in [0, 1].
   */
  step(dtSeconds: number, input: InputBuffer): number {
    const clamped = Math.min(Math.max(dtSeconds, 0), 0.05);
    this.accumulator += clamped;
    let substeps = 0;
    while (this.accumulator >= FIXED_DT && substeps < MAX_SUBSTEPS) {
      this.fixedUpdate(FIXED_DT, input);
      this.accumulator -= FIXED_DT;
      substeps += 1;
    }
    if (substeps >= MAX_SUBSTEPS) {
      this.accumulator = 0;
    }
    return this.accumulator / FIXED_DT;
  }

  getInterpolatedSnapshot(alpha: number): SimulationSnapshot {
    const t = clamp(alpha, 0, 1);
    return {
      joints: cloneJoints(this.curr.joints),
      arm: lerpArm(this.prev.arm, this.curr.arm, t),
      blocks: this.curr.blocks.map((block, i) => {
        const prev = this.prev.blocks[i] ?? block;
        return {
          ...block,
          position: vecLerp(prev.position, block.position, t),
          rotation: quatSlerp(prev.rotation, block.rotation, t),
        };
      }),
      graspedBlockId: this.curr.graspedBlockId,
      tick: this.curr.tick,
      debugBoxes: this.curr.debugBoxes,
    };
  }

  reset(): void {
    this.rebuildScene();
    this.events.push({ type: "reset" });
  }

  /**
   * Drive the arm from a decoded agent command. Null returns control to the keyboard.
   */
  setAgentCommand(command: AgentCommand | null): void {
    this.agentCommand = command;
  }

  getCurrentSnapshot(): SimulationSnapshot {
    return this.curr;
  }

  dispose(): void {
    try {
      this.world.free();
    } catch {
      // WASM already torn down (Fast Refresh / unmount race).
    }
  }

  private fixedUpdate(dt: number, input: InputBuffer): void {
    if (input.resetQueued) {
      input.resetQueued = false;
      this.rebuildScene();
      this.events.push({ type: "reset" });
      return;
    }

    const prevJoints = cloneJoints(this.joints);

    if (this.agentCommand) {
      this.servoAgent(this.agentCommand, dt);
    } else {
      if (input.gripperToggleQueued) {
        input.gripperToggleQueued = false;
        this.gripperTarget = this.gripperTarget > 0.5 ? 0 : 1;
      }

      for (const [key, pressed] of Object.entries(input.held)) {
        if (!pressed) continue;
        const binding = KEY_BINDINGS[key];
        if (!binding) continue;
        const limit = JOINT_LIMITS[binding.joint];
        this.joints[binding.joint] = clamp(
          this.joints[binding.joint] + binding.dir * JOINT_SPEED * dt,
          limit.min,
          limit.max,
        );
      }
    }

    const gLimit = JOINT_LIMITS.gripper;
    const gDir = this.gripperTarget > this.joints.gripper ? 1 : this.gripperTarget < this.joints.gripper ? -1 : 0;
    if (gDir !== 0) {
      this.joints.gripper = clamp(this.joints.gripper + gDir * GRIPPER_SPEED * dt, gLimit.min, gLimit.max);
      if (Math.abs(this.joints.gripper - this.gripperTarget) < 0.01) {
        this.joints.gripper = this.gripperTarget;
      }
    }

    let arm = forwardKinematics(this.joints);
    if (!armClearsTable(arm)) {
      this.joints = prevJoints;
      arm = forwardKinematics(this.joints);
    }
    this.gripperBody.setNextKinematicTranslation({
      x: arm.tcp.position[0],
      y: arm.tcp.position[1],
      z: arm.tcp.position[2],
    });
    this.gripperBody.setNextKinematicRotation({
      x: arm.tcp.rotation[0],
      y: arm.tcp.rotation[1],
      z: arm.tcp.rotation[2],
      w: arm.tcp.rotation[3],
    });
    this.syncJawColliders();

    const closed = this.joints.gripper >= GRASP_CLOSE_THRESHOLD;
    if (closed && !this.graspedBlockId) {
      this.tryGrasp(arm.tcp.position, arm.tcp.rotation);
    }
    if (this.joints.gripper <= GRASP_OPEN_THRESHOLD && this.graspedBlockId) {
      this.release();
    }
    this.syncHeldBlock(arm.tcp.position);

    try {
      this.world.step();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rapier panic";
      this.events.push({ type: "panic", message });
      this.rebuildScene();
      return;
    }

    this.containBlocks();

    this.prev = this.curr;
    this.tick += 1;
    this.curr = this.capture(arm);
  }

  private servoAgent(command: AgentCommand, dt: number): void {
    const names = ["baseYaw", "shoulderPitch", "elbowPitch", "wristPitch"] as const;
    for (const name of names) {
      const limit = JOINT_LIMITS[name];
      const target = clamp(command.joints[name], limit.min, limit.max);
      this.joints[name] = moveToward(this.joints[name], target, JOINT_SPEED * dt);
    }
    this.gripperTarget = command.gripperClosed ? 1 : 0;
  }

  private tryGrasp(tcp: [number, number, number], tcpRot: [number, number, number, number]): void {
    if (this.graspedBlockId) return;
    const blocks = Array.from(this.blockBodies.entries()).map(([id, body]) => {
      const t = body.translation();
      return { id, position: [t.x, t.y, t.z] as [number, number, number] };
    });
    const targetId = findGraspTarget(tcp, tcpRot, blocks);
    if (!targetId) return;
    const body = this.blockBodies.get(targetId);
    if (!body) return;
    try {
      attachBlockToGripper(body, tcp);
      this.graspedBlockId = targetId;
      this.setBlockArmCollision(body, false);
      this.events.push({ type: "grasp", blockId: targetId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "grasp attach failed";
      this.events.push({ type: "panic", message });
    }
  }

  private release(): void {
    const id = this.graspedBlockId;
    this.graspedBlockId = null;
    if (id) {
      const held = this.blockBodies.get(id);
      if (held) {
        releaseHeldBlock(held);
        this.setBlockArmCollision(held, true);
      }
      this.events.push({ type: "release", blockId: id });
    }
  }

  /**
   * Glues the held cube to the TCP so lift/carry cannot leave it on the table.
   */
  private syncHeldBlock(tcp: [number, number, number]): void {
    if (!this.graspedBlockId) return;
    const body = this.blockBodies.get(this.graspedBlockId);
    if (!body) return;
    followGripper(body, tcp);
  }

  /**
   * Held cubes skip arm contacts so the grasp joint is not fighting the solver.
   */
  private setBlockArmCollision(body: RigidBody, collideWithArm: boolean): void {
    const groups = collideWithArm ? GROUPS_BLOCK : GROUPS_BLOCK_HELD;
    const n = body.numColliders();
    for (let i = 0; i < n; i += 1) {
      body.collider(i).setCollisionGroups(groups);
    }
  }

  /** Matches visual jaw half-gap in `forwardKinematics`. */
  private jawSeparation(): number {
    return JAW_MIN_SEP / 2 + ((JAW_MAX_SEP - JAW_MIN_SEP) / 2) * (1 - this.joints.gripper);
  }

  /**
   * Keep Rapier jaw colliders aligned with the visual fingers (TCP-local).
   */
  private syncJawColliders(): void {
    const sep = this.jawSeparation();
    const x = JAW_LENGTH / 2 - GRASP_DEPTH;
    this.jawLeftCollider.setTranslationWrtParent({ x, y: 0, z: sep });
    this.jawRightCollider.setTranslationWrtParent({ x, y: 0, z: -sep });
  }

  /**
   * Keep cubes on the table/floor surface. Kinematic grasp can still pull a block; this snaps Y back.
   */
  private containBlocks(): void {
    this.blockBodies.forEach((body, id) => {
      if (id === this.graspedBlockId) return;
      const t = body.translation();
      const minY = minBlockCenterY(t.x, t.z);
      if (t.y >= minY) return;
      body.setTranslation({ x: t.x, y: minY, z: t.z }, true);
      const v = body.linvel();
      body.setLinvel({ x: v.x * 0.35, y: Math.max(0, v.y), z: v.z * 0.35 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
  }

  private rebuildScene(): void {
    try {
      this.world.free();
    } catch {
      // First build has a live world; subsequent rebuilds free it.
    }
    this.world = new RAPIER.World({ x: 0, y: GRAVITY_Y, z: 0 });
    this.world.timestep = FIXED_DT;
    this.world.numSolverIterations = 8;
    this.graspedBlockId = null;
    this.blockBodies.clear();
    this.joints = cloneJoints(DEFAULT_JOINTS);
    this.gripperTarget = 0;
    this.tick = 0;
    this.accumulator = 0;
    // Keep agentCommand: the match loop re-sends it every frame.

    const floorDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -FLOOR_HALF_EXTENTS.y, 0);
    const floor = this.world.createRigidBody(floorDesc);
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(FLOOR_HALF_EXTENTS.x, FLOOR_HALF_EXTENTS.y, FLOOR_HALF_EXTENTS.z)
        .setFriction(0.95)
        .setCollisionGroups(GROUPS_STATIC),
      floor,
    );

    const tableDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, TABLE_CENTER_Y, 0);
    const table = this.world.createRigidBody(tableDesc);
    const tablePhysHalfY = 0.09;
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(TABLE_HALF_EXTENTS.x, tablePhysHalfY, TABLE_HALF_EXTENTS.z)
        .setTranslation(0, TABLE_TOP_Y - tablePhysHalfY - TABLE_CENTER_Y, 0)
        .setFriction(1.05)
        .setRestitution(0)
        .setCollisionGroups(GROUPS_STATIC),
      table,
    );
    for (const wall of TABLE_WALLS) {
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(...wall.halfExtents)
          .setTranslation(...wall.local)
          .setFriction(0.45)
          .setRestitution(0)
          .setCollisionGroups(GROUPS_STATIC),
        table,
      );
    }

    const arm = forwardKinematics(this.joints);
    const gripperDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(arm.tcp.position[0], arm.tcp.position[1], arm.tcp.position[2])
      .setRotation({
        x: arm.tcp.rotation[0],
        y: arm.tcp.rotation[1],
        z: arm.tcp.rotation[2],
        w: arm.tcp.rotation[3],
      });
    this.gripperBody = this.world.createRigidBody(gripperDesc);
    // Palm pad sits at the visual palm (behind TCP) so it does not occupy the cube volume.
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.022, 0.024, 0.038)
        .setTranslation(-GRASP_DEPTH, 0, 0)
        .setDensity(0)
        .setFriction(0.9)
        .setCollisionGroups(GROUPS_ARM),
      this.gripperBody,
    );
    const jawHx = JAW_LENGTH / 2;
    const jawHy = JAW_HEIGHT / 2;
    const jawHz = JAW_THICKNESS / 2;
    const jawX = jawHx - GRASP_DEPTH;
    const openSep = this.jawSeparation();
    this.jawLeftCollider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(jawHx, jawHy, jawHz)
        .setTranslation(jawX, 0, openSep)
        .setDensity(0)
        .setFriction(0.88)
        .setCollisionGroups(GROUPS_ARM),
      this.gripperBody,
    );
    this.jawRightCollider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(jawHx, jawHy, jawHz)
        .setTranslation(jawX, 0, -openSep)
        .setDensity(0)
        .setFriction(0.88)
        .setCollisionGroups(GROUPS_ARM),
      this.gripperBody,
    );

    for (const spawn of this.spawns) {
      const desc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(spawn.position[0], spawn.position[1], spawn.position[2])
        .setCcdEnabled(true)
        .setLinearDamping(0.28)
        .setAngularDamping(0.55)
        .setCanSleep(true);
      const body = this.world.createRigidBody(desc);
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(CUBE_HALF, CUBE_HALF, CUBE_HALF)
          .setFriction(1.2)
          .setRestitution(0)
          .setDensity(2.0)
          .setCollisionGroups(GROUPS_BLOCK),
        body,
      );
      this.blockBodies.set(spawn.id, body);
    }

    const snapshot = this.capture(arm);
    this.prev = snapshot;
    this.curr = snapshot;
  }

  private capture(arm: ArmSnapshot): SimulationSnapshot {
    const blocks: BlockState[] = this.spawns.map((spawn) => {
      const body = this.blockBodies.get(spawn.id);
      if (!body) {
        return {
          id: spawn.id,
          position: [...spawn.position],
          rotation: [0, 0, 0, 1],
          color: spawn.color,
        };
      }
      const pose = poseFromRapier(body);
      return { id: spawn.id, color: spawn.color, ...pose };
    });

    const debugBoxes: DebugBox[] = [
      {
        id: "table",
        position: [0, TABLE_CENTER_Y, 0],
        rotation: [0, 0, 0, 1],
        halfExtents: [TABLE_HALF_EXTENTS.x, TABLE_HALF_EXTENTS.y, TABLE_HALF_EXTENTS.z],
        color: "#00AEEF",
      },
      ...TABLE_WALLS.map((wall) => ({
        id: wall.id,
        position: [wall.local[0], TABLE_CENTER_Y + wall.local[1], wall.local[2]] as [number, number, number],
        rotation: [0, 0, 0, 1] as [number, number, number, number],
        halfExtents: wall.halfExtents,
        color: "#00AEEF",
      })),
      {
        id: "palm",
        position: [...arm.palm.position],
        rotation: [...arm.palm.rotation],
        halfExtents: [0.022, 0.024, 0.038],
        color: "#F7941E",
      },
      {
        id: "jaw_left",
        position: [...arm.jawLeft.position],
        rotation: [...arm.jawLeft.rotation],
        halfExtents: [JAW_LENGTH / 2, JAW_HEIGHT / 2, JAW_THICKNESS / 2],
        color: "#F7941E",
      },
      {
        id: "jaw_right",
        position: [...arm.jawRight.position],
        rotation: [...arm.jawRight.rotation],
        halfExtents: [JAW_LENGTH / 2, JAW_HEIGHT / 2, JAW_THICKNESS / 2],
        color: "#F7941E",
      },
      ...blocks.map((block) => ({
        id: block.id,
        position: block.position,
        rotation: block.rotation,
        halfExtents: [CUBE_HALF, CUBE_HALF, CUBE_HALF] as [number, number, number],
        color: block.color,
      })),
    ];

    return {
      joints: cloneJoints(this.joints),
      arm,
      blocks,
      graspedBlockId: this.graspedBlockId,
      tick: this.tick,
      debugBoxes,
    };
  }
}
