# VSArena Python SDK

Submit a stacking agent in under 10 minutes. Default track is **VLA**: image + instruction, no cube poses.

Package lives in-repo (`sdk/python`). Product guide on the site: `/submit` (Beginner + Researcher). Protocol reference: `/docs`. PyPI publish is post-MVP.

## Install

Python 3.11+. From the repo root:

```bash
pip install -e sdk/python
python -m vsarena
```

Live WebSocket client (needed only for official ELO):

```bash
pip install -e "sdk/python[live]"
```

## Beginner path

1. Open Studio and try the task with the keyboard (Q/A, W/S, E/D, R/F, Space). Tab demos never write public ELO.
2. Sign in with GitHub → `/account` → copy the API key and register an `agent_name`.
3. Dry-run a starter locally (`dry_run=True`). You get a local score; nothing hits the public board.
4. Keep the same `act(state) → action` shape. Read `instruction` + `images.scene`. Do not parse `scene.blocks` on the VLA track (empty on purpose).
5. Go live only when ready: set `VSARENA_API_KEY` + `VSARENA_HARNESS_URL`, then `dry_run=False`. In Studio use **Wake harness & spectate** to watch — the tab still does not score.

Hold-still starter:

```python
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))
```

Color-blob baseline (not a neural VLA):

```python
from vsarena import ColorSeek, run_match

print(run_match(ColorSeek(), dry_run=True, mode="vla"))
```

## Researcher path

Same public board. Assumes you already ship policies: VLA observation contract, hosted harness, signed results.

### 1. Account + agent ownership

1. Sign in with GitHub → `/account`.
2. Copy the API key. Register `agent_name` before live hello — the harness checks ownership; stranger names are rejected.
3. Treat the key like a password. Operators (not SDK users) put `HARNESS_INGEST_SECRET` (16+ chars) on the app + harness so ingest can write ELO.

### 2. Implement `act` (VLA)

```python
import base64
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

print(run_match(MyAgent(), dry_run=True, mode="vla"))
```

Prefer `dry_run=True` until `act()` is stable under the **2 s / 5 Hz** budget. Invalid actions never touch Rapier.

`mode="state"` is debug-only (privileged poses). It is not the public VLA track and does not write public ELO.

### 3. Live against the official harness

Environment:

| Variable | Where |
| --- | --- |
| `VSARENA_API_KEY` | from `/account` |
| `VSARENA_HARNESS_URL` | `wss://vsarena-harness.onrender.com` (hosted) or `ws://127.0.0.1:8787` (local `npm run harness`) |
| `VSARENA_AGENT_NAME` | optional; defaults in your script |

Python:

```python
import os
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        _ = state["instruction"]
        _ = state["images"]["scene"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}

run_match(
    MyAgent(),
    dry_run=False,
    mode="vla",
    api_key=os.environ["VSARENA_API_KEY"],
    agent_name=os.environ.get("VSARENA_AGENT_NAME", "MyAgent"),
)
```

CLI:

```bash
# after: pip install -e "sdk/python[live]"
# export VSARENA_API_KEY=…   # from /account
# export VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com
python -m vsarena --live --task block_stacking
```

Binary ELO: full tower only. Spectate without scoring: Studio → Official eval → **Wake harness & spectate** (read-only view of the judge; your policy still runs on your machine).

### 4. Verify the receipt

Official live `result` objects include:

- `provenance.sampler_seed` / `provenance.eval_window` — one ISO-week seed shared by every agent
- `control` — benign public-layout arm next to the scored held-out score
- `digest` — SHA-256 of the canonical manifest
- `signature` — Ed25519 over DSSE PAE

Verify a row against `GET /api/eval/keys`. The ingest secret is channel auth, not the receipt. Studio live shows the control table plus last week's best runs — not the current held-out. See [eval-integrity.md](eval-integrity.md).

## When does the public board update?

Only after a **live VLA** match through the official harness ingest. Studio teleop, Baseline-IK, ColorSeek in the tab, and `dry_run=True` do not count. Browser POSTs to `/api/matches` are rejected on purpose.

## If something breaks

- **Timeout (2 s / 5 Hz):** return an action every tick; holding last joints is valid.
- **Dry-run has no ELO:** expected. Only harness ingest writes the board.
- **Hello rejected:** fresh API key + exact registered `agent_name`.
- **Live but no ELO:** missing ingest secret on app/harness, or `mode` was not `vla`.
- **Product version on `/health` lags:** hosted harness may still report an older build after a local package bump — redeploy the harness.

## Record demos (imitation data)

In Studio, **Record demo** captures the VLA camera at 5 Hz plus `joint_targets`, `ee_delta` (metres since the previous sample), and gripper. Cube poses are **not** stored.

```python
from vsarena import ReplayAgent, load_episode, run_match

episode = load_episode("vsarena-demo.json")
print(run_match(ReplayAgent(episode), dry_run=True, ticks=len(episode["frames"])))
```

Format `vsarena-demo-v1`: one JSON object, `frames[].images.scene` same as the harness (`mime: image/rgb8`). Not LeRobot parquet yet — convert downstream if you train ACT/diffusion.

Protocol: [harness.md](harness.md) · Eval integrity: [eval-integrity.md](eval-integrity.md) · Site guide: `/submit`
