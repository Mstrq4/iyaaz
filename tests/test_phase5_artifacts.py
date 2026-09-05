from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ENV_EXAMPLE = ROOT / ".env.example"

TRANSLATION_ARTIFACTS = {
    "overlay": DATA_DIR / "library.en.snapshot.json",
    "manifest": DATA_DIR / "library.en.manifest.json",
    "cache": DATA_DIR / "translation-cache.json",
}

PUBLIC_ARTIFACTS = [
    DATA_DIR / "library.snapshot.json",
    TRANSLATION_ARTIFACTS["overlay"],
]

FORBIDDEN_PUBLIC_KEYS = {
    "source",
    "reference",
    "sourcereference",
    "source_reference",
    "المصدر المرجعي",
}
URL_RE = re.compile(r"(?:https?://|www\.)", re.IGNORECASE)
PUBLIC_TRANSLATION_ENV_RE = re.compile(
    r"NEXT_PUBLIC_[A-Z0-9_]*(?:TRANSLATION|TRANSLATOR)[A-Z0-9_]*",
    re.IGNORECASE,
)
BROWSER_FORBIDDEN_TRANSLATION_MARKERS = (
    "api.cognitive.microsofttranslator.com",
    "ocp-apim-subscription-key",
    "iyaaz_translation_api_key",
    "iyaaz_translation_endpoint",
    "/translate?api-version",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assert_public_json_safe(testcase: unittest.TestCase, value: Any, *, location: str = "root") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            normalized_key = str(key).strip().lower().replace("-", "_")
            testcase.assertNotIn(
                normalized_key,
                FORBIDDEN_PUBLIC_KEYS,
                f"forbidden source/reference key at {location}.{key}",
            )
            assert_public_json_safe(testcase, child, location=f"{location}.{key}")
        return

    if isinstance(value, list):
        for index, child in enumerate(value):
            assert_public_json_safe(testcase, child, location=f"{location}[{index}]")
        return

    if isinstance(value, str):
        testcase.assertIsNone(
            URL_RE.search(value),
            f"public artifact contains a raw URL at {location}",
        )


class Phase5ArtifactSecurityTests(unittest.TestCase):
    def test_translation_secret_is_not_public_or_committed_in_env_example(self):
        env_text = ENV_EXAMPLE.read_text(encoding="utf-8")
        self.assertIsNone(PUBLIC_TRANSLATION_ENV_RE.search(env_text))

        matching = [
            line
            for line in env_text.splitlines()
            if line.startswith("IYAAZ_TRANSLATION_API_KEY=")
        ]
        self.assertEqual(matching, ["IYAAZ_TRANSLATION_API_KEY="])

        for path in ROOT.glob("next.config.*"):
            config_text = path.read_text(encoding="utf-8")
            self.assertNotIn("IYAAZ_TRANSLATION_API_KEY", config_text)
            self.assertIsNone(PUBLIC_TRANSLATION_ENV_RE.search(config_text))

    def test_browser_source_contains_no_runtime_translation_endpoint_or_secret_reference(self):
        browser_root = ROOT / "src"
        checked = 0
        for path in browser_root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx"}:
                continue
            checked += 1
            text = path.read_text(encoding="utf-8").lower()
            for marker in BROWSER_FORBIDDEN_TRANSLATION_MARKERS:
                self.assertNotIn(marker, text, f"runtime translation marker leaked into {path.relative_to(ROOT)}")
            self.assertIsNone(
                PUBLIC_TRANSLATION_ENV_RE.search(text),
                f"public translation environment reference leaked into {path.relative_to(ROOT)}",
            )
        self.assertGreater(checked, 0)

    def test_public_library_artifacts_have_no_source_reference_keys_or_raw_urls(self):
        checked = 0
        for path in PUBLIC_ARTIFACTS:
            if not path.exists():
                continue
            checked += 1
            parsed = json.loads(path.read_text(encoding="utf-8"))
            assert_public_json_safe(self, parsed, location=path.name)
        self.assertGreaterEqual(checked, 1)

    def test_english_translation_artifacts_are_all_or_none_and_manifest_hashes_match(self):
        existence = {name: path.exists() for name, path in TRANSLATION_ARTIFACTS.items()}
        if not any(existence.values()):
            return

        self.assertTrue(all(existence.values()), f"partial English artifact set: {existence}")
        overlay_path = TRANSLATION_ARTIFACTS["overlay"]
        manifest_path = TRANSLATION_ARTIFACTS["manifest"]
        cache_path = TRANSLATION_ARTIFACTS["cache"]

        overlay = json.loads(overlay_path.read_text(encoding="utf-8"))
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        cache = json.loads(cache_path.read_text(encoding="utf-8"))

        self.assertIsInstance(overlay, list)
        self.assertIsInstance(cache, dict)
        self.assertEqual(manifest["file"], overlay_path.name)
        self.assertEqual(manifest["cacheFile"], cache_path.name)
        self.assertEqual(manifest["recordCount"], len(overlay))
        self.assertEqual(manifest["sha256"], sha256(overlay_path))
        self.assertEqual(manifest["cacheSha256"], sha256(cache_path))
        self.assertEqual(
            manifest["sourceSnapshotSha256"],
            sha256(DATA_DIR / "library.snapshot.json"),
        )

        serialized_manifest_cache = json.dumps(
            {"manifest": manifest, "cache": cache},
            ensure_ascii=False,
        ).lower()
        self.assertNotIn("ocp-apim-subscription-key", serialized_manifest_cache)
        self.assertNotIn("iyaaz_translation_api_key", serialized_manifest_cache)


if __name__ == "__main__":
    unittest.main()
