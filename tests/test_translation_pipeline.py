from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.translation_pipeline import (
    TRANSLATABLE_FIELDS,
    build_translation_overlay,
    source_hash,
    write_translation_artifacts,
)


class FakeProvider:
    name = "fake"

    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def translate_batch(self, texts: list[str]) -> list[str]:
        self.calls.append(list(texts))
        return [f"EN::{text}" for text in texts]


class TranslationPipelineTests(unittest.TestCase):
    def sample_record(self, *, function_text: str = "تصميم واجهة متجر") -> dict[str, object]:
        return {
            "id": 3,
            "shortcut": "/ACPStorefrontLuxury",
            "nameAr": "واجهة كلادينج فاخرة",
            "mainDomain": "الدعاية والإعلان",
            "category": "واجهات المحلات",
            "subcategory": "واجهات كلادينج",
            "shortcutType": "متخصص",
            "functionText": function_text,
            "requiredInputs": "اسم المتجر؛ الألوان؛ الشعار",
            "executionInstructions": "أنشئ واجهة فاخرة",
            "outputs": "تصميم نهائي",
            "sizeRatio": "16:9",
            "materialsTech": "كلادينج",
            "lighting": "إضاءة ليلية",
            "installationExecution": "تنفيذ واقعي",
            "visualStyle": "فاخر",
            "brandCompliance": "التزم بالهوية",
            "combinedShortcuts": "/A + /B",
            "bestUse": "المتاجر",
            "keywords": "واجهة، متجر",
            "assetType": "صورة",
            "notes": "ملاحظة",
        }

    def test_source_hash_is_sha256_of_normalized_text(self):
        expected = hashlib.sha256("نص واحد".encode("utf-8")).hexdigest()
        self.assertEqual(source_hash("  نص   واحد  "), expected)

    def test_overlay_translates_only_public_translatable_fields_and_preserves_identity(self):
        provider = FakeProvider()
        overlay, cache = build_translation_overlay([self.sample_record()], {}, provider)

        self.assertEqual(overlay[0]["id"], 3)
        self.assertEqual(overlay[0]["shortcut"], "/ACPStorefrontLuxury")
        self.assertNotIn("combinedShortcuts", overlay[0])
        self.assertEqual(set(overlay[0]) - {"id", "shortcut"}, set(TRANSLATABLE_FIELDS))
        self.assertEqual(overlay[0]["nameAr"], "EN::واجهة كلادينج فاخرة")
        self.assertEqual(len(cache), len(TRANSLATABLE_FIELDS))
        self.assertEqual(sum(len(call) for call in provider.calls), len(TRANSLATABLE_FIELDS))

    def test_unchanged_cache_is_reused_without_provider_calls(self):
        record = self.sample_record()
        first_provider = FakeProvider()
        first_overlay, cache = build_translation_overlay([record], {}, first_provider)

        second_provider = FakeProvider()
        second_overlay, second_cache = build_translation_overlay([record], cache, second_provider)

        self.assertEqual(first_overlay, second_overlay)
        self.assertEqual(cache, second_cache)
        self.assertEqual(second_provider.calls, [])

    def test_changed_field_retranslates_only_that_field(self):
        first_provider = FakeProvider()
        _, cache = build_translation_overlay([self.sample_record()], {}, first_provider)

        second_provider = FakeProvider()
        overlay, _ = build_translation_overlay(
            [self.sample_record(function_text="تصميم واجهة متجر حديثة")],
            cache,
            second_provider,
        )

        self.assertEqual(second_provider.calls, [["تصميم واجهة متجر حديثة"]])
        self.assertEqual(overlay[0]["functionText"], "EN::تصميم واجهة متجر حديثة")

    def test_translated_urls_are_removed_before_public_output(self):
        class UrlProvider(FakeProvider):
            def translate_batch(self, texts: list[str]) -> list[str]:
                return [f"Translated {text} https://example.com/private" for text in texts]

        overlay, _ = build_translation_overlay([self.sample_record()], {}, UrlProvider())
        serialized = json.dumps(overlay, ensure_ascii=False).lower()
        self.assertNotIn("http://", serialized)
        self.assertNotIn("https://", serialized)
        self.assertNotIn("www.", serialized)

    def test_artifact_writer_is_deterministic_and_manifest_contains_no_secret(self):
        provider = FakeProvider()
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir)
            manifest = write_translation_artifacts(
                [self.sample_record()],
                output_dir,
                provider,
                existing_cache={},
                source_snapshot_sha256="abc123",
            )
            overlay_path = output_dir / "library.en.snapshot.json"
            cache_path = output_dir / "translation-cache.json"
            manifest_path = output_dir / "library.en.manifest.json"

            self.assertTrue(overlay_path.exists())
            self.assertTrue(cache_path.exists())
            self.assertTrue(manifest_path.exists())
            raw = overlay_path.read_bytes()
            self.assertEqual(manifest["sha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual(manifest["sourceSnapshotSha256"], "abc123")
            self.assertEqual(manifest["recordCount"], 1)
            self.assertEqual(manifest["provider"], "fake")
            serialized = json.dumps(
                {
                    "manifest": manifest,
                    "cache": json.loads(cache_path.read_text(encoding="utf-8")),
                },
                ensure_ascii=False,
            ).lower()
            self.assertNotIn("api_key", serialized)
            self.assertNotIn("subscription-key", serialized)
            self.assertNotIn("secret", serialized)


if __name__ == "__main__":
    unittest.main()
