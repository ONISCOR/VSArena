# VSArena Python SDK

Default track is VLA: `instruction` + RGB, no cube poses. Live matches talk to the harness WebSocket (`VSARENA_HARNESS_URL` or local `npm run harness`).

## Install (from the repo)

```bash
pip install -e sdk/python
python -m vsarena
```

Live WebSocket client:

```bash
pip install -e "sdk/python[live]"
```

## Quickstart

```python
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        _ = state["instruction"]
        _ = state.get("images")
        return {"joint_targets": dict(joints), "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))
```

Record a teleop JSON in `/simulation` (**Record demo**), then:

```python
from vsarena import ReplayAgent, load_episode, run_match

print(run_match(ReplayAgent(load_episode("vsarena-demo.json")), dry_run=True))
```

### Live (public ELO)

1. Sign in → **Account** → copy API key → register agent name.
2. Hosted harness (recommended): `VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com`  
   Health: `https://vsarena-harness.onrender.com/health`. Self-host: [deploy/harness/README.md](../../deploy/harness/README.md).
3. Or local: `npm run harness` (defaults to `ws://127.0.0.1:8787`).
4. Ingest secret is configured on the hosted harness + Vercel app (you only need the API key).

```bash
export VSARENA_API_KEY=…   # from https://www.vsarena.app/account
export VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com
python -c "from vsarena import ColorSeek, run_match; print(run_match(ColorSeek(), dry_run=False, mode='vla'))"
```

Protocol: [docs/harness.md](../../docs/harness.md) · Eval integrity: [docs/eval-integrity.md](../../docs/eval-integrity.md)
