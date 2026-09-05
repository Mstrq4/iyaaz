import json
import unittest
from pathlib import Path


class VercelFrameworkConfigTests(unittest.TestCase):
    def test_vercel_config_pins_nextjs_framework(self):
        config_path = Path(__file__).resolve().parents[1] / "vercel.json"
        self.assertTrue(config_path.exists(), "vercel.json must pin the Vercel framework preset")
        config = json.loads(config_path.read_text(encoding="utf-8"))
        self.assertEqual(config.get("framework"), "nextjs")


if __name__ == "__main__":
    unittest.main()
