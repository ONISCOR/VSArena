# Assumption: live URL from ws_url= or VSARENA_HARNESS_URL, else ws://127.0.0.1:8787; key from api_key= or VSARENA_API_KEY.
"""Run a match locally (mock) or against the VSArena WebSocket harness."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

from vsarena.agent import Agent
from vsarena.mock_env import run_dry_run
from vsarena.taxonomy import format_harness_error

_DEFAULT_LOCAL_WS = "ws://127.0.0.1:8787"
_OPEN_TIMEOUT_S = 90
_CLOSE_TIMEOUT_S = 4
_CONNECT_ATTEMPTS = 4
_CONNECT_RETRY_SLEEP_S = 5.0
_HEALTH_TIMEOUT_S = 90.0


def _resolve_ws_url(ws_url: str | None) -> str:
    """Prefer explicit arg, then VSARENA_HARNESS_URL, then local harness.

    Example:
        _resolve_ws_url(None)  # env or ws://127.0.0.1:8787
    """
    if ws_url and ws_url.strip():
        return ws_url.strip()
    env = (os.environ.get("VSARENA_HARNESS_URL") or "").strip()
    return env or _DEFAULT_LOCAL_WS


def health_url_from_ws(ws_url: str) -> str:
    """Map a harness WebSocket URL to its HTTP /health endpoint.

    Example:
        health_url_from_ws("wss://host/path")  # "https://host/health"
    """
    base = ws_url.strip()
    if base.startswith("wss://"):
        http = "https://" + base[len("wss://") :]
    elif base.startswith("ws://"):
        http = "http://" + base[len("ws://") :]
    else:
        http = base
    # Drop path after host (e.g. trailing /) then pin /health.
    without_scheme, sep, rest = http.partition("://")
    if not sep:
        return http.rstrip("/") + "/health"
    host_and_path = rest.split("/", 1)[0]
    return f"{without_scheme}://{host_and_path}/health"


def wake_harness(ws_url: str, *, timeout_s: float = _HEALTH_TIMEOUT_S) -> bool:
    """GET /health to warm a cold Render free-tier instance. Returns True on HTTP 200.

    Example:
        wake_harness("wss://vsarena-harness.onrender.com")
    """
    url = health_url_from_ws(ws_url)
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout_s) as response:
            return 200 <= int(response.status) < 300
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return False


def run_match(
    agent: Agent,
    *,
    task: str = "block_stacking",
    api_key: str | None = None,
    dry_run: bool = True,
    ws_url: str | None = None,
    ticks: int = 12,
    mode: str = "vla",
    agent_name: str | None = None,
) -> dict[str, Any]:
    """Evaluate `agent` in the mock env or on a live harness.

    Args:
        agent: Object with `act(state) -> action`.
        task: Only `block_stacking` in MVP.
        api_key: Required for live matches (from /account).
        dry_run: If True, never opens a socket.
        ws_url: Live harness; else `VSARENA_HARNESS_URL`; else `ws://127.0.0.1:8787`.
        ticks: Mock horizon.
        mode: `vla` (RGB + instruction) or `state` (privileged poses, debug).
        agent_name: Leaderboard label; must be an agent you registered on /account.

    Example:
        run_match(MyAgent(), dry_run=True)
        run_match(MyAgent(), dry_run=False, api_key=os.environ["VSARENA_API_KEY"], agent_name="MyBot")
    """
    if task != "block_stacking":
        raise ValueError("MVP only supports task='block_stacking'")
    if mode not in ("vla", "state"):
        raise ValueError("mode must be 'vla' or 'state'")
    if dry_run:
        return run_dry_run(agent, ticks=ticks, mode=mode)
    key = api_key or os.environ.get("VSARENA_API_KEY")
    if not key:
        raise ValueError("live match needs api_key= or VSARENA_API_KEY")
    return _run_live(
        agent,
        api_key=key,
        ws_url=_resolve_ws_url(ws_url),
        task=task,
        mode=mode,
        agent_name=agent_name,
    )


def _run_live(
    agent: Agent,
    *,
    api_key: str,
    ws_url: str,
    task: str,
    mode: str,
    agent_name: str | None,
) -> dict[str, Any]:
    try:
        from websockets.sync.client import connect
    except ImportError as exc:
        raise ImportError("live matches require: pip install 'vsarena[live]'") from exc

    hello: dict[str, Any] = {"type": "hello", "api_key": api_key, "task": task, "mode": mode}
    if agent_name:
        hello["agent"] = agent_name

    # Warm cold hosts (Render free tier often needs 30–60s) before opening the socket.
    wake_harness(ws_url)

    last_error: Exception | None = None
    for attempt in range(1, _CONNECT_ATTEMPTS + 1):
        try:
            with connect(ws_url, open_timeout=_OPEN_TIMEOUT_S, close_timeout=_CLOSE_TIMEOUT_S) as socket:
                socket.send(json.dumps(hello))
                result: dict[str, Any] | None = None
                while True:
                    raw = socket.recv(timeout=120)
                    message = json.loads(raw)
                    kind = message.get("type")
                    if kind == "error":
                        raise RuntimeError(format_harness_error(message))
                    if kind == "result":
                        result = message
                        break
                    if kind != "state":
                        continue
                    action = agent.act(message)
                    payload: dict[str, Any] = {
                        "gripper_state": action.get("gripper_state", "open"),
                    }
                    if action.get("joint_targets") is not None:
                        payload["joint_targets"] = dict(action.get("joint_targets") or {})
                    if action.get("ee_delta") is not None:
                        payload["ee_delta"] = dict(action["ee_delta"])
                    socket.send(
                        json.dumps(
                            {
                                "type": "action",
                                "match_id": message["match_id"],
                                "tick": message["tick"],
                                "action": payload,
                            }
                        )
                    )
                assert result is not None
                return result
        except RuntimeError:
            # Protocol / harness errors (busy, auth, ownership) — do not retry.
            raise
        except Exception as exc:  # noqa: BLE001 — retry only connect/transport failures
            last_error = exc
            if attempt >= _CONNECT_ATTEMPTS:
                break
            wake_harness(ws_url)
            time.sleep(_CONNECT_RETRY_SLEEP_S * attempt)

    assert last_error is not None
    raise RuntimeError(
        f"could not connect to harness after {_CONNECT_ATTEMPTS} attempts "
        f"(open_timeout={_OPEN_TIMEOUT_S}s): {last_error}"
    ) from last_error
