from __future__ import annotations

import gzip
import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data" / "library.snapshot.json.gz"
MANIFEST = ROOT / "data" / "library.manifest.json"


class SnapshotArtifactTests(unittest.TestCase):
    def load_records(self) -> list[dict[str, object]]:
        self.assertTrue(SNAPSHOT.exists(), "data/library.snapshot.json.gz must exist for Phase 3B")
        with gzip.open(SNAPSHOT, "rt", encoding="utf-8") as handle:
            records = json.load(handle)
        self.assertIsInstance(records, list)
        return records

    def load_manifest(self) -> dict[str, object]:
        self.assertTrue(MANIFEST.exists(), "data/library.manifest.json must exist for Phase 3B")
        return json.loads(MANIFEST.read_text(encoding="utf-8"))

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
        compressed = SNAPSHOT.read_bytes()
        with gzip.open(SNAPSHOT, "rb") as handle:
            raw = handle.read()

        self.assertEqual(manifest["schemaVersion"], 1)
        self.assertEqual(manifest["recordCount"], 5812)
        self.assertEqual(manifest["domainCount"], 9)
        self.assertEqual(manifest["categoryCount"], 21)
        self.assertEqual(manifest["subcategoryCount"], 364)
        self.assertEqual(manifest["sha256"], hashlib.sha256(raw).hexdigest())
        self.assertEqual(manifest["compressedSha256"], hashlib.sha256(compressed).hexdigest())


if __name__ == "__main__":
    unittest.main()
