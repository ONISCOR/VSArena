# VSArena Python SDK

Submit a stacking agent in under 10 minutes. Default track is **VLA**: image + instruction, no cube poses.

Package lives in-repo (`sdk/python`). Product docs: `/docs` on the site. PyPI publish is post-MVP.

## Install

Python 3.11+. From the repo root:

```bash
pip install -e sdk/python
python -m vsarena
```

Live WebSocket client:

```bash
pip install -e "sdk/python[live]"
```

## 1. Get an API key

1. Sign in with GitHub → click your handle → `/account`.
2. Copy the key. Register an agent name (this is the leaderboard label).
3. Put `HARNESS_INGEST_SECRET` (16+ chars) in `.env.local` so live matches can write ELO.

## 2. Implement `act` (VLA)

```python
import base64
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        instruction = state["instruction"]
        img = state["images"]["scene"]
        rgb = base64.b64decode(img["b64"])  # len = width * height * 3
        joints = state["scene"]["joint_states"]
        # your vision-language policy here — do not expect state["scene"]["blocks"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}
        # or: return {"ee_delta": {"dx": 0.01, "dy": 0.0, "dz": 0.0}, "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))
```

In-repo vision baseline (color blobs, not a neural VLA):

```python
from vsarena import ColorSeek, run_match

run_match(ColorSeek(), dry_run=True, mode="vla")
# live: run_match(ColorSeek(), dry_run=False, mode="vla", api_key="…", agent_name="ColorSeek")
```

Live:

```python
run_match(MyAgent(), dry_run=False, mode="vla", api_key="…", agent_name="MyAgent")
```

`mode="state"` is debug-only (privileged poses). It is not the public VLA track.

Official live `result` objects also include `provenance.sampler_seed` and `provenance.eval_window` (one ISO-week seed shared by every agent), `control` (benign public-layout arm next to the scored held-out score), `digest` (SHA-256 of the canonical manifest), and `signature` (Ed25519 over DSSE PAE). Verify a row against `GET /api/eval/keys`. The ingest secret is channel auth, not the receipt. Studio live shows the control table plus last week's best runs — not the current held-out. See [eval-integrity.md](eval-integrity.md).

## 3. Record demos (imitation data)

In `/simulation`, **Record demo** captures the VLA camera at 5 Hz plus `joint_targets`, `ee_delta` (metres since the previous sample), and gripper. Cube poses are **not** stored.

```python
from vsarena import ReplayAgent, load_episode, run_match

episode = load_episode("vsarena-demo.json")
print(run_match(ReplayAgent(episode), dry_run=True, ticks=len(episode["frames"])))
```

Format `vsarena-demo-v1`: one JSON object, `frames[].images.scene` same as the harness (`mime: image/rgb8`). Not LeRobot parquet yet — convert downstream if you train ACT/diffusion.

Protocol: [harness.md](harness.md) · Eval integrity: [eval-integrity.md](eval-integrity.md)
