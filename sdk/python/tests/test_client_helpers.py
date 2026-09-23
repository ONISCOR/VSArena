import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vsarena import __version__
from vsarena.client import health_url_from_ws
from vsarena.taxonomy import FAILURE_CODES


class ClientHelpersTests(unittest.TestCase):
    def test_health_url_from_ws(self) -> None:
        self.assertEqual(
            health_url_from_ws("wss://vsarena-harness.onrender.com"),
            "https://vsarena-harness.onrender.com/health",
        )
        self.assertEqual(
            health_url_from_ws("ws://127.0.0.1:8787"),
            "http://127.0.0.1:8787/health",
        )
        self.assertEqual(
            health_url_from_ws("wss://host.example/extra"),
            "https://host.example/health",
        )

    def test_sdk_version_matches_product(self) -> None:
        self.assertEqual(__version__, "1.0.0")

    def test_ownership_codes_present(self) -> None:
        self.assertIn("protocol.agent_unregistered", FAILURE_CODES)
        self.assertIn("protocol.agent_forbidden", FAILURE_CODES)
        self.assertIn("protocol.rate_limited", FAILURE_CODES)
        self.assertIn("protocol.state_mode_not_scored", FAILURE_CODES)


if __name__ == "__main__":
    unittest.main()
