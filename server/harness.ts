// Assumption: standalone Node process for live matches. PORT (cloud) or HARNESS_PORT (local, default 8787).
// Agent socket = judge. /spectate = read-only fan-out for the website (no actions, no ELO writes).

import "./loadEnv";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  ACTION_TIMEOUT_MS,
  FIXED_DT,
  HARNESS_TICK_HZ,
  MATCH_GRASP_GRACE_TICKS,
  MATCH_MAX_TICKS,
  VLA_MATCH_MAX_TICKS,
} from "../simulation/constants";
import { ArenaSimulation } from "../simulation/rapierWorld";
import { createTorqueTracker, scoreMatch, sampleTorque, taskCompletion } from "../lib/scoring";
import {
  applyAgentAction,
  isActionMessage,
  isHelloMessage,
  parseHarnessMessage,
  snapshotToState,
} from "../lib/harness/codec";
import type { ActionMessage, HelloMessage, ObservationMode, ResultMessage } from "../lib/harness/protocol";
import {
  isSpectatePath,
  snapshotToSpectateFrame,
  type SpectateFrameMessage,
  type SpectateMessage,
} from "../lib/harness/spectate";
import { parseActionContract } from "../lib/eval/actionSchema";
import { degenerateControl, shouldRunLiveControl, type ControlArm } from "../lib/eval/control";
import { buildRunManifest, resultsSigningSecret, signRunManifest } from "../lib/eval/manifest";
import { buildProvenance, gitSha, latencyBudgetMs, policyHz } from "../lib/eval/provenance";
import { PHYSICS_HZ, PRODUCT_VERSION, RAPIER_VERSION } from "../lib/eval/product";
import { buildReplayArtifact, maybeRecordReplaySample, type ReplaySample } from "../lib/eval/replay";
import { samplerSeedFromAgent } from "../lib/eval/sampler";
import { resolveScene, type ResolvedScene } from "../lib/eval/scenes";
import {
  INVALID_ACTION_BUDGET,
  emptyCounters,
  harnessError,
  matchFailure,
  officialMatchStatus,
  shouldIngestOfficialResult,
  timeoutStrikeBudget,
  type EvalCounters,
  type FailureCode,
} from "../lib/eval/taxonomy";
import { VLA_ACTION_TIMEOUT_MS, VLA_POLICY_HZ } from "../lib/vision/raster";
import { verifyHarnessApiKey } from "./verifyApiKey";
import { ingestOfficialResult } from "./ingestResult";

const PORT = Number(process.env.PORT ?? process.env.HARNESS_PORT ?? 8787);
const STATE_STEP = 1 / HARNESS_TICK_HZ;
const VLA_STEP = 1 / VLA_POLICY_HZ;
/** State track is 20 Hz; fans out at half rate to keep spectate light. */
const SPECTATE_STATE_EVERY = 2;

/** MVP: one Rapier world at a time on a free VM. */
let matchBusy = false;

const spectators = new Set<WebSocket>();
let lastSpectateFrame: SpectateFrameMessage | null = null;

const server = createServer((req, res) => {
  void handleHttp(req, res);
});

const wss = new WebSocketServer({ server });

server.listen(PORT, "0.0.0.0", () => {
  const prod = process.env.NODE_ENV === "production";
  console.log(`[vsarena-harness] http://0.0.0.0:${PORT}/health`);
  console.log(`[vsarena-harness] ws://0.0.0.0:${PORT} (agent)`);
  console.log(`[vsarena-harness] ws://0.0.0.0:${PORT}/spectate (read-only)`);
  console.log(`[vsarena-harness] eval ${PRODUCT_VERSION} rapier ${RAPIER_VERSION} sha=${gitSha().slice(0, 8)}`);
  if (prod) console.log("[vsarena-harness] NODE_ENV=production — api_key lookup required");
});

wss.on("connection", (socket, req) => {
  const path = (req.url ?? "/").split("?")[0] ?? "/";
  if (isSpectatePath(path)) {
    handleSpectate(socket);
    return;
  }
  void handleConnection(socket).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "connection failed";
    const code: FailureCode = message.includes("hello timeout")
      ? "protocol.hello_timeout"
      : "harness.disconnect";
    safeSend(socket, harnessError(code, message, code === "protocol.hello_timeout"));
    socket.close();
  });
});

/**
 * Health for reverse proxies / cloud probes (+ eval provenance).
 *
 * @example GET /health → { ok: true, busy: false }
 */
function handleHttp(req: IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && (path === "/health" || path === "/")) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    const live = lastSpectateFrame
      ? {
          match_id: lastSpectateFrame.match_id,
          agent: lastSpectateFrame.agent,
          mode: lastSpectateFrame.mode,
          tick: lastSpectateFrame.tick,
        }
      : null;
    const sampleScene = resolveScene({ matchId: "health" });
    res.end(
      JSON.stringify({
        ok: true,
        busy: matchBusy,
        live,
        spectators: spectators.size,
        eval: {
          product: PRODUCT_VERSION,
          rapier: RAPIER_VERSION,
          physics_hz: PHYSICS_HZ,
          git_sha: gitSha(),
          scene_set: sampleScene.set,
          sampler: "agent-name",
          results_signed: resultsSigningSecret().length >= 16,
          live_control: shouldRunLiveControl(sampleScene.set),
          latency_budget_ms: { vla: VLA_ACTION_TIMEOUT_MS, state: ACTION_TIMEOUT_MS },
          policy_hz: { vla: VLA_POLICY_HZ, state: HARNESS_TICK_HZ },
        },
      }),
    );
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not found" }));
}

/**
 * Read-only watchers. Ignore inbound messages; never write ELO.
 */
function handleSpectate(socket: WebSocket): void {
  spectators.add(socket);
  if (lastSpectateFrame && matchBusy) {
    safeSend(socket, lastSpectateFrame);
  } else {
    safeSend(socket, { type: "spectate_idle", busy: false } satisfies SpectateMessage);
  }
  const drop = () => {
    spectators.delete(socket);
  };
  socket.on("close", drop);
  socket.on("error", drop);
  socket.on("message", () => {
    // Spectators cannot send actions.
  });
}

function broadcastSpectate(payload: SpectateMessage): void {
  if (payload.type === "spectate_frame") {
    lastSpectateFrame = payload;
  }
  if (payload.type === "spectate_idle" || payload.type === "spectate_result") {
    lastSpectateFrame = null;
  }
  for (const spec of spectators) {
    safeSend(spec, payload);
  }
}

async function handleConnection(socket: WebSocket): Promise<void> {
  if (matchBusy) {
    safeSend(socket, harnessError("harness.busy", "one live match at a time; retry shortly", true));
    socket.close();
    return;
  }

  const hello = await waitForHello(socket);
  if (!hello.api_key) {
    safeSend(socket, harnessError("protocol.api_key_required", "api_key required"));
    socket.close();
    return;
  }
  if (hello.task && hello.task !== "block_stacking") {
    safeSend(socket, harnessError("protocol.invalid_task", "MVP only supports task=block_stacking"));
    socket.close();
    return;
  }

  matchBusy = true;
  let agentName = "unknown";

  try {
    const auth = await verifyHarnessApiKey(hello.api_key);
    if (!auth.ok) {
      const code: FailureCode =
        auth.reason.includes("misconfigured") || auth.reason.includes("service role")
          ? "harness.misconfigured"
          : "protocol.invalid_api_key";
      safeSend(socket, harnessError(code, auth.reason));
      socket.close();
      return;
    }

    const mode: ObservationMode = hello.mode === "state" ? "state" : "vla";
    agentName = (hello.agent ?? auth.username).trim() || auth.username;
    const step = mode === "vla" ? VLA_STEP : STATE_STEP;
    const physSteps = Math.max(1, Math.round(step / FIXED_DT));
    const actionTimeout = latencyBudgetMs(mode);
    const timeoutBudget = timeoutStrikeBudget(mode);

    const matchId = globalThis.crypto.randomUUID();
    const samplerSeed = samplerSeedFromAgent(agentName);
    const scoredScene = resolveScene({ matchId, samplerSeed, arm: "scored" });
    const controlScene = resolveScene({ matchId, samplerSeed, arm: "control" });
    const runControl = shouldRunLiveControl(scoredScene.set);

    console.log(
      `[vsarena-harness] match start user=${auth.username} mode=${mode} agent=${agentName} seed=${samplerSeed} scene=${scoredScene.id} control=${runControl ? "live" : "degenerate"} hz=${policyHz(mode)}`,
    );

    const bag: EpisodeBag = {
      lastAction: null,
      lastActionAt: Date.now(),
      closed: false,
      counters: emptyCounters(),
    };

    const onMessage = (data: WebSocket.RawData) => {
      const parsed = parseHarnessMessage(String(data));
      if (!isActionMessage(parsed)) {
        if (parsed && typeof parsed === "object" && (parsed as { type?: string }).type === "action") {
          bag.counters.invalid_actions += 1;
          safeSend(socket, harnessError("protocol.schema_violation", "malformed action envelope", true));
        }
        return;
      }
      if (parsed.match_id !== matchId) return;
      const contract = parseActionContract(parsed.action);
      if (!contract.ok) {
        bag.counters.invalid_actions += 1;
        safeSend(socket, harnessError("protocol.invalid_action", contract.reason, true));
        return;
      }
      bag.lastAction = contract.action;
      bag.lastActionAt = Date.now();
      bag.counters.consecutive_timeouts = 0;
    };

    socket.on("message", onMessage);
    socket.on("close", () => {
      bag.closed = true;
    });
    socket.on("error", () => {
      bag.closed = true;
    });

    try {
      let control: ControlArm | null = null;
      if (runControl) {
        resetEpisode(bag);
        const controlEpisode = await runEpisode({
          socket,
          bag,
          matchId,
          agentName,
          mode,
          scene: controlScene,
          step,
          physSteps,
          actionTimeout,
          timeoutBudget,
        });
        if (controlEpisode.kind === "disconnected") {
          console.log(`[vsarena-harness] abort harness.disconnect agent=${agentName} arm=control`);
          return;
        }
        control = {
          arm: "control",
          status: controlEpisode.status,
          task_completion_score: controlEpisode.scores.task_completion_score,
          spatial_accuracy: controlEpisode.scores.spatial_accuracy,
          failure: controlEpisode.failure,
          scene: {
            set: "public",
            id: "public.canonical",
            seed: 0,
            hash: controlScene.hash,
          },
          degenerate: false,
        };
      }

      resetEpisode(bag);
      const scored = await runEpisode({
        socket,
        bag,
        matchId,
        agentName,
        mode,
        scene: scoredScene,
        step,
        physSteps,
        actionTimeout,
        timeoutBudget,
      });
      if (scored.kind === "disconnected") {
        console.log(`[vsarena-harness] abort harness.disconnect agent=${agentName} scene=${scoredScene.id}`);
        return;
      }

      if (!control) {
        control = degenerateControl({
          status: scored.status,
          task_completion_score: scored.scores.task_completion_score,
          spatial_accuracy: scored.scores.spatial_accuracy,
          failure: scored.failure,
          hash: controlScene.hash,
        });
      }

      await publishOfficialResult({
        socket,
        matchId,
        agentName,
        mode,
        samplerSeed,
        scene: scoredScene,
        scored,
        control,
      });
    } finally {
      socket.off("message", onMessage);
      console.log(`[vsarena-harness] match end agent=${agentName}`);
    }
  } finally {
    matchBusy = false;
    broadcastSpectate({ type: "spectate_idle", busy: false });
  }
}

interface EpisodeBag {
  lastAction: ActionMessage["action"] | null;
  lastActionAt: number;
  closed: boolean;
  counters: EvalCounters;
}

type EpisodeDone = {
  kind: "done";
  scores: ReturnType<typeof scoreMatch>;
  failure: ReturnType<typeof matchFailure>;
  status: "completed" | "failed";
  counters: EvalCounters;
  replaySamples: ReplaySample[];
};

type EpisodeOutcome = EpisodeDone | { kind: "disconnected" };

function resetEpisode(bag: EpisodeBag): void {
  bag.lastAction = null;
  bag.lastActionAt = Date.now();
  bag.counters = emptyCounters();
}

/**
 * One control or scored rollout on a fresh Rapier world.
 */
async function runEpisode(input: {
  socket: WebSocket;
  bag: EpisodeBag;
  matchId: string;
  agentName: string;
  mode: ObservationMode;
  scene: ResolvedScene;
  step: number;
  physSteps: number;
  actionTimeout: number;
  timeoutBudget: number;
}): Promise<EpisodeOutcome> {
  const replaySamples: ReplaySample[] = [];
  let sim: ArenaSimulation | null = null;
  let spectateCounter = 0;
  try {
    sim = await ArenaSimulation.create({ spawns: input.scene.spawns });
    const tracker = createTorqueTracker();

    while (!input.bag.closed && input.socket.readyState === input.socket.OPEN) {
      if (input.bag.counters.invalid_actions >= INVALID_ACTION_BUDGET) {
        return finishEpisode(sim, tracker, replaySamples, input, false);
      }

      const snapshot = sim.getCurrentSnapshot();
      maybeRecordReplaySample(replaySamples, snapshot, input.mode);
      const cap = input.mode === "vla" ? VLA_MATCH_MAX_TICKS : MATCH_MAX_TICKS;
      const overtime = snapshot.tick >= cap;
      const holding = snapshot.graspedBlockId !== null;
      const stacked = taskCompletion(snapshot.blocks, snapshot.graspedBlockId) >= 1 && !holding;
      if (stacked) {
        return finishEpisode(sim, tracker, replaySamples, input, false);
      }
      if (input.bag.counters.consecutive_timeouts >= input.timeoutBudget) {
        return finishEpisode(sim, tracker, replaySamples, input, false);
      }
      if ((overtime && !holding) || snapshot.tick >= cap + MATCH_GRASP_GRACE_TICKS) {
        return finishEpisode(sim, tracker, replaySamples, input, false);
      }

      const state = snapshotToState(snapshot, input.matchId, snapshot.tick, { mode: input.mode });
      safeSend(input.socket, state);

      spectateCounter += 1;
      const emitSpectate = input.mode === "vla" || spectateCounter % SPECTATE_STATE_EVERY === 0;
      if (emitSpectate) {
        broadcastSpectate(snapshotToSpectateFrame(snapshot, input.matchId, input.agentName, input.mode));
      }

      if (Date.now() - input.bag.lastActionAt > input.actionTimeout) {
        input.bag.counters.action_timeouts += 1;
        input.bag.counters.consecutive_timeouts += 1;
        input.bag.lastAction = input.bag.lastAction ?? {
          joint_targets: { ...state.scene.joint_states },
          gripper_state: "open",
        };
      }

      if (input.bag.lastAction) {
        const prev = snapshot.joints;
        const joints = applyAgentAction(snapshot, input.bag.lastAction);
        sim.setAgentCommand({ joints, gripperClosed: input.bag.lastAction.gripper_state === "closed" });
        sampleTorque(tracker, prev, joints);
      }

      for (let i = 0; i < input.physSteps; i += 1) {
        sim.step(FIXED_DT, { held: {}, gripperToggleQueued: false, resetQueued: false });
      }

      await sleep(input.step * 1000);
    }

    if (sim) {
      maybeRecordReplaySample(replaySamples, sim.getCurrentSnapshot(), input.mode);
    }
    return { kind: "disconnected" };
  } finally {
    if (sim) {
      sim.setAgentCommand(null);
      sim.dispose();
    }
  }
}

function finishEpisode(
  sim: ArenaSimulation,
  tracker: ReturnType<typeof createTorqueTracker>,
  replaySamples: ReplaySample[],
  input: { bag: EpisodeBag; mode: ObservationMode; timeoutBudget: number },
  disconnected: boolean,
): EpisodeDone {
  const snapshot = sim.getCurrentSnapshot();
  maybeRecordReplaySample(replaySamples, snapshot, input.mode);
  const scores = scoreMatch(snapshot.blocks, tracker, snapshot.graspedBlockId);
  const failure = matchFailure({
    completion: scores.task_completion_score,
    consecutiveTimeouts: input.bag.counters.consecutive_timeouts,
    timeoutBudget: input.timeoutBudget,
    invalidActions: input.bag.counters.invalid_actions,
    invalidBudget: INVALID_ACTION_BUDGET,
    disconnected,
  });
  return {
    kind: "done",
    scores,
    failure,
    status: officialMatchStatus(failure.code),
    counters: { ...input.bag.counters },
    replaySamples,
  };
}

async function publishOfficialResult(input: {
  socket: WebSocket;
  matchId: string;
  agentName: string;
  mode: ObservationMode;
  samplerSeed: number;
  scene: ResolvedScene;
  scored: EpisodeDone;
  control: ControlArm;
}): Promise<void> {
  const provenance = buildProvenance({
    mode: input.mode,
    samplerSeed: input.samplerSeed,
    scene: {
      set: input.scene.set,
      id: input.scene.id,
      seed: input.scene.seed,
      hash: input.scene.hash,
      private_override: input.scene.private_override,
      arm: "scored",
    },
    counters: input.scored.counters,
  });
  const scores = {
    spatial_accuracy: input.scored.scores.spatial_accuracy,
    task_completion_score: input.scored.scores.task_completion_score,
    joint_torque_telemetry: input.scored.scores.joint_torque_telemetry,
  };
  const result: ResultMessage = {
    type: "result",
    match_id: input.matchId,
    status: input.scored.status,
    scores,
    elo_delta: 0,
    failure: input.scored.failure,
    provenance,
    control: input.control,
  };
  result.replay = buildReplayArtifact({
    matchId: input.matchId,
    agent: input.agentName,
    provenance,
    failure: input.scored.failure,
    scores,
    status: input.scored.status,
    samples: input.scored.replaySamples,
  });

  const secret = resultsSigningSecret();
  if (secret.length >= 16) {
    result.signature = signRunManifest(
      buildRunManifest({
        match_id: input.matchId,
        agent: input.agentName,
        status: input.scored.status,
        scores,
        sampler_seed: input.samplerSeed,
        failure: input.scored.failure,
        provenance,
        control: input.control,
      }),
      secret,
    );
  } else {
    console.warn("[vsarena-harness] results signing key missing — official ingest will reject");
  }

  if (shouldIngestOfficialResult(input.scored.failure) && result.signature) {
    await ingestOfficialResult(input.agentName, result);
  }
  safeSend(input.socket, result);
  broadcastSpectate({
    type: "spectate_result",
    match_id: input.matchId,
    agent: input.agentName,
    status: result.status,
    scores: result.scores,
    elo_delta: result.elo_delta,
  });
}

function waitForHello(socket: WebSocket): Promise<HelloMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("hello timeout")), 5000);
    const onMessage = (data: WebSocket.RawData) => {
      const parsed = parseHarnessMessage(String(data));
      if (!isHelloMessage(parsed)) return;
      clearTimeout(timer);
      socket.off("message", onMessage);
      resolve(parsed);
    };
    socket.on("message", onMessage);
    socket.once("close", () => {
      clearTimeout(timer);
      reject(new Error("socket closed before hello"));
    });
  });
}

function safeSend(socket: WebSocket, payload: unknown): void {
  if (socket.readyState !== socket.OPEN) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch {
    // Drop on a dead socket; the close handler tears down the match.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
