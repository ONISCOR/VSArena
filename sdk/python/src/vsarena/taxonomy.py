# Assumption: codes stay in lockstep with lib/eval/taxonomy.ts.
"""Published failure taxonomy and action-contract checks."""

from __future__ import annotations

import math
from typing import Any, Mapping

FAILURE_DOMAINS = ("policy", "protocol", "harness")

FAILURE_CODES = (
    "policy.task_complete",
    "policy.task_incomplete",
    "policy.timeout",
    "protocol.hello_timeout",
    "protocol.api_key_required",
    "protocol.invalid_api_key",
    "protocol.invalid_task",
    "protocol.invalid_action",
    "protocol.schema_violation",
    "protocol.agent_unregistered",
    "protocol.agent_forbidden",
    "protocol.rate_limited",
    "protocol.state_mode_not_scored",
    "harness.busy",
    "harness.queued",
    "harness.misconfigured",
    "harness.disconnect",
)

JOINT_KEYS = ("joint_1", "joint_2", "joint_3", "joint_4")
_MAX_JOINT = math.pi * 2
_MAX_EE_M = 0.25

NEGATIVE_ACTION_FIXTURES: tuple[dict[str, Any], ...] = (
    {"name": "missing gripper", "action": {"joint_targets": {"joint_1": 0}}},
    {"name": "nan joint", "action": {"gripper_state": "open", "joint_targets": {"joint_1": float("nan")}}},
    {"name": "unknown joint", "action": {"gripper_state": "open", "joint_targets": {"joint_9": 0}}},
    {"name": "huge ee_delta", "action": {"gripper_state": "open", "ee_delta": {"dx": 9, "dy": 0, "dz": 0}}},
    {"name": "empty motion", "action": {"gripper_state": "open"}},
    {"name": "empty joint_targets", "action": {"gripper_state": "open", "joint_targets": {}}},
    {"name": "not an object", "action": None},
)


def format_harness_error(message: Mapping[str, Any]) -> str:
    """`code: message` string for RuntimeError.

    Example:
        format_harness_error({"code": "harness.busy", "message": "retry"})
    """
    code = message.get("code")
    text = str(message.get("message") or "harness error")
    if code and not text.startswith(str(code)):
        return f"{code}: {text}"
    return text


def parse_action_contract(action: Any) -> tuple[bool, str]:
    """Validate an on-wire action. Returns (ok, reason).

    Example:
        parse_action_contract({"gripper_state": "open", "joint_targets": {"joint_1": 0}})
    """
    if not isinstance(action, Mapping):
        return False, "action object required"
    gripper = action.get("gripper_state")
    if gripper not in ("open", "closed"):
        return False, "gripper_state must be open|closed"

    has_joints = False
    targets = action.get("joint_targets")
    if targets is not None:
        if not isinstance(targets, Mapping):
            return False, "joint_targets must be an object"
        for key, value in targets.items():
            if key not in JOINT_KEYS:
                return False, f"unknown joint {key}"
            if not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > _MAX_JOINT:
                return False, f"joint {key} out of range"
            has_joints = True

    delta = action.get("ee_delta")
    has_delta = delta is not None
    if has_delta:
        if not isinstance(delta, Mapping):
            return False, "ee_delta must be an object"
        try:
            dx, dy, dz = float(delta["dx"]), float(delta["dy"]), float(delta["dz"])
        except (KeyError, TypeError, ValueError):
            return False, "ee_delta dx/dy/dz must be finite metres"
        if not all(math.isfinite(n) for n in (dx, dy, dz)):
            return False, "ee_delta dx/dy/dz must be finite metres"
        if abs(dx) > _MAX_EE_M or abs(dy) > _MAX_EE_M or abs(dz) > _MAX_EE_M:
            return False, "ee_delta exceeds 0.25 m per tick"

    if not has_joints and not has_delta:
        return False, "joint_targets or ee_delta required"
    return True, ""
