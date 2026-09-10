/** Copy for /docs. Mirrors docs/sdk.md and docs/harness.md without inventing APIs. */

export const DOC_NAV = [
  { id: "overview", label: "What it is" },
  { id: "quickstart", label: "Quickstart" },
  { id: "tracks", label: "VLA vs state" },
  { id: "elo", label: "How ELO is written" },
  { id: "protocol", label: "Protocol" },
  { id: "demos", label: "Demos" },
  { id: "fail", label: "If it fails" },
] as const;

export const QUICKSTART_INSTALL = `pip install -e sdk/python
python -m vsarena

# live WebSocket client
pip install -e "sdk/python[live]"`;

export const QUICKSTART_BEGINNER = `from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))`;

export const QUICKSTART_BEGINNER_SEEK = `from vsarena import ColorSeek, run_match

print(run_match(ColorSeek(), dry_run=True, mode="vla"))`;

export const QUICKSTART_ACT = `import base64
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        instruction = state["instruction"]
        img = state["images"]["scene"]
        rgb = base64.b64decode(img["b64"])  # len = width * height * 3
        joints = state["scene"]["joint_states"]
        # your vision-language policy — do not expect state["scene"]["blocks"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}
        # or: return {"ee_delta": {"dx": 0.01, "dy": 0.0, "dz": 0.0}, "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))`;

export const QUICKSTART_LIVE = `from vsarena import ColorSeek, run_match

run_match(ColorSeek(), dry_run=True, mode="vla")
# live (needs npm run harness + API key):
# run_match(ColorSeek(), dry_run=False, mode="vla", api_key="…", agent_name="ColorSeek")`;

export const QUICKSTART_LIVE_RUN = `from vsarena import ColorSeek, run_match

run_match(ColorSeek(), dry_run=False, mode="vla", api_key="…", agent_name="ColorSeek")`;

export const QUICKSTART_PRACTICE = `from vsarena import ColorSeek, run_match

print(run_match(ColorSeek(), dry_run=True, mode="vla"))`;

export const QUICKSTART_REPLAY = `from vsarena import ReplayAgent, load_episode, run_match

episode = load_episode("vsarena-demo.json")
print(run_match(ReplayAgent(episode), dry_run=True, ticks=len(episode["frames"])))`;

export const PROTOCOL_HELLO = `{
  "type": "hello",
  "api_key": "…",
  "task": "block_stacking",
  "mode": "vla",
  "agent": "my-policy"
}`;

export const PROTOCOL_STATE = `{
  "type": "state",
  "match_id": "uuid",
  "tick": 142,
  "timestamp_ms": 1234567890,
  "observation_mode": "vla",
  "instruction": "Stack the three cubes into a tower on the pad: cyan base, orange middle, magenta on top.",
  "scene": {
    "gripper_pose": [0, 0, 0, 0, 0, 0, 1],
    "blocks": [],
    "joint_states": { "joint_1": 0.0, "joint_2": 0.6, "joint_3": -1.2, "joint_4": -0.4 },
    "grasped_block_id": null
  },
  "images": {
    "scene": { "mime": "image/rgb8", "width": 128, "height": 128, "b64": "…" }
  }
}`;

export const PROTOCOL_ACTION = `{
  "type": "action",
  "match_id": "uuid",
  "tick": 142,
  "action": {
    "joint_targets": { "joint_1": 0.2, "joint_2": 0.7, "joint_3": -1.1, "joint_4": -0.3 },
    "ee_delta": { "dx": 0.02, "dy": 0.0, "dz": 0.0 },
    "gripper_state": "closed"
  }
}`;

export const PROTOCOL_RESULT = `{
  "type": "result",
  "match_id": "uuid",
  "status": "completed",
  "scores": {
    "spatial_accuracy": 0.94,
    "task_completion_score": 1.0,
    "joint_torque_telemetry": { "peak": 12.3, "avg": 4.1 }
  },
  "elo_delta": 18,
  "failure": {
    "code": "policy.task_complete",
    "domain": "policy",
    "message": "policy.task_complete: stack slots filled",
    "recoverable": false
  },
  "provenance": { "product": "0.6.0", "rapier": "0.20.0", "physics_hz": 60, "git_sha": "…", "sampler_seed": 123456789, "eval_window": "2026-W37" },
  "control": { "arm": "control", "task_completion_score": 0, "degenerate": false },
  "digest": "hex sha256",
  "signature": "base64 ed25519-dsse"
}`;
