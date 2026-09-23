"""CLI: dry-run by default; `--live` talks to the official harness (judge outside the tab)."""

from __future__ import annotations

import argparse
import json
import os
from typing import Any, Mapping, MutableMapping

from vsarena.agent import Agent
from vsarena.client import run_match


class HoldPose(Agent):
    """Sanity-check agent: keep current joints, gripper open."""

    def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m vsarena")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Connect to VSARENA_HARNESS_URL (default dry-run, no ELO).",
    )
    parser.add_argument(
        "--task",
        default="block_stacking",
        help="Task id (informational; harness selects the official stacking task).",
    )
    parser.add_argument(
        "--agent-name",
        default=os.environ.get("VSARENA_AGENT_NAME", "HoldPose"),
        help="Leaderboard label (must exist on /account for live).",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("VSARENA_API_KEY", ""),
        help="From /account (or env VSARENA_API_KEY).",
    )
    args = parser.parse_args()
    _ = args.task

    if args.live:
        key = (args.api_key or "").strip()
        if not key:
            raise SystemExit(
                "live requires --api-key or VSARENA_API_KEY (create one on /account)."
            )
        result = run_match(
            HoldPose(),
            dry_run=False,
            mode="vla",
            api_key=key,
            agent_name=args.agent_name,
        )
    else:
        result = run_match(HoldPose(), dry_run=True, mode="vla")

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
