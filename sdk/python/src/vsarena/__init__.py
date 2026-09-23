"""VSArena Python SDK.

Dry-run needs no extra packages. Live WebSocket matches: `pip install vsarena[live]`.
"""

from vsarena.agent import Agent
from vsarena.client import health_url_from_ws, run_match, wake_harness
from vsarena.color_seek import ColorSeek
from vsarena.dataset import ReplayAgent, load_episode
from vsarena.taxonomy import FAILURE_CODES, format_harness_error, parse_action_contract

__version__ = "1.0.0"

__all__ = [
    "FAILURE_CODES",
    "Agent",
    "ColorSeek",
    "ReplayAgent",
    "format_harness_error",
    "health_url_from_ws",
    "load_episode",
    "parse_action_contract",
    "run_match",
    "wake_harness",
]
