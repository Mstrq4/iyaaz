from __future__ import annotations

import base64
import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path

import brotli

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MANIFEST = DATA / "library.manifest.json"


class SnapshotArtifactTests(unittest.TestCase):
    def load_manifest(self) -> dict[str, object]:
        self.assertTrue(MANIFEST.exists(), "data/library.manifest.json must exist for Phase 3B")
        return json.loads(MANIFEST.read_text(encoding="utf-8"))

    def load_records(self) -> list[dict[str, object]]:
        manifest = self.load_manifest()
        chunks = manifest.get("chunks")
        self.assertIsInstance(chunks, list)
        self.assertEqual(len(chunks), 17)

        encoded_parts: list[str] = []
        for chunk in chunks:
            self.assertIsInstance(chunk, dict)
            path = DATA / str(chunk["file"])
            self.assertTrue(path.exists(), f"missing snapshot chunk: {path.name}")
            text = path.read_text(encoding="ascii")
            self.assertEqual(len(text), chunk["charCount"])
            self.assertEqual(hashlib.sha256(text.encode("ascii")).hexdigest(), chunk["sha256"])
            encoded_parts.append(text)

        compressed = base64.b64decode("".join(encoded_parts), validate=True)
        self.assertEqual(hashlib.sha256(compressed).hexdigest(), manifest["compressedSha256"])
        raw = brotli.decompress(compressed)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), manifest["sha256"])
        records = json.loads(raw.decode("utf-8"))
        self.assertIsInstance(records, list)
        return records

    def test_snapshot_exact_count_uniqueness_and_contiguous_ids(self):
        records = self.load_records()
        self.assertEqual(len(records), 5812)
        ids = [record["id"] for record in records]
        shortcuts = [record["shortcut"] for record in records]
        self.assertEqual(ids, list(range(1, 5813)))
        self.assertEqual(len(set(shortcuts)), 5812)

    def test_snapshot_taxonomy_and_type_counts_match_approved_workbook(self):
        records = self.load_records()
        self.assertEqual(len({record["mainDomain"] for record in records}), 9)
        self.assertEqual(len({record["category"] for record in records}), 21)
        self.assertEqual(len({record["subcategory"] for record in records}), 364)
        self.assertEqual(
            Counter(record["shortcutType"] for record in records),
            Counter({"متخصص": 5622, "مركب": 72, "Master": 118}),
        )

    def test_snapshot_contains_no_source_fields_or_urls(self):
        records = self.load_records()
        serialized = json.dumps(records, ensure_ascii=False, sort_keys=True)
        lowered = serialized.lower()
        self.assertNotIn("المصدر المرجعي", serialized)
        self.assertNotIn("source", lowered)
        self.assertNotIn("http://", lowered)
        self.assertNotIn("https://", lowered)
        self.assertNotIn("www.", lowered)

    def test_manifest_describes_the_exact_committed_snapshot(self):
        manifest = self.load_manifest()
        self.assertEqual(manifest["schemaVersion"], 1)
        self.assertEqual(manifest["format"], "json+brotli+base64-chunks")
        self.assertEqual(manifest["base64ChunkSize"], 12000)
        self.assertEqual(manifest["recordCount"], 5812)
        self.assertEqual(manifest["domainCount"], 9)
        self.assertEqual(manifest["categoryCount"], 21)
        self.assertEqual(manifest["subcategoryCount"], 364)
        self.assertEqual(manifest["typeCounts"], {"Master": 118, "متخصص": 5622, "مركب": 72})


if __name__ == "__main__":
    unittest.main()
