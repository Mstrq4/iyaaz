from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.translation_pipeline import (
    CACHE_NAME,
    MANIFEST_NAME,
    OVERLAY_NAME,
    TRANSLATABLE_FIELDS,
    AzureTranslatorProvider,
    build_translation_overlay,
    provider_from_environment,
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
            overlay_path = output_dir / OVERLAY_NAME
            cache_path = output_dir / CACHE_NAME
            manifest_path = output_dir / MANIFEST_NAME

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

    def test_azure_adapter_sends_secret_only_in_header_and_batches_requests(self):
        requests: list[tuple[str, dict[str, str], bytes]] = []

        def transport(url: str, headers: dict[str, str], body: bytes) -> tuple[int, bytes]:
            requests.append((url, dict(headers), body))
            payload = json.loads(body.decode("utf-8"))
            response = [
                {"translations": [{"text": f"EN::{item['Text']}", "to": "en"}]}
                for item in payload
            ]
            return 200, json.dumps(response).encode("utf-8")

        provider = AzureTranslatorProvider(
            api_key="super-secret-value",
            region="uaenorth",
            batch_size=2,
            transport=transport,
        )
        result = provider.translate_batch(["واحد", "اثنان", "ثلاثة"])

        self.assertEqual(result, ["EN::واحد", "EN::اثنان", "EN::ثلاثة"])
        self.assertEqual(len(requests), 2)
        for url, headers, body in requests:
            self.assertIn("api-version=3.0", url)
            self.assertIn("from=ar", url)
            self.assertIn("to=en", url)
            self.assertNotIn("super-secret-value", url)
            self.assertNotIn(b"super-secret-value", body)
            self.assertEqual(headers["Ocp-Apim-Subscription-Key"], "super-secret-value")
            self.assertEqual(headers["Ocp-Apim-Subscription-Region"], "uaenorth")
            self.assertEqual(headers["Content-Type"], "application/json")

    def test_azure_adapter_retries_429_then_succeeds_with_bounded_attempts(self):
        statuses = [429, 200]
        sleeps: list[float] = []

        def transport(url: str, headers: dict[str, str], body: bytes) -> tuple[int, bytes]:
            status = statuses.pop(0)
            if status == 429:
                return status, b'{"error":{"message":"slow down"}}'
            return 200, b'[{"translations":[{"text":"Hello","to":"en"}]}]'

        provider = AzureTranslatorProvider(
            api_key="key",
            max_retries=2,
            transport=transport,
            sleep_fn=sleeps.append,
        )
        self.assertEqual(provider.translate_batch(["مرحبا"]), ["Hello"])
        self.assertEqual(len(sleeps), 1)

    def test_azure_adapter_rejects_malformed_success_response(self):
        provider = AzureTranslatorProvider(
            api_key="key",
            transport=lambda url, headers, body: (200, b'{}'),
        )
        with self.assertRaisesRegex(ValueError, "malformed"):
            provider.translate_batch(["مرحبا"])

    def test_provider_from_environment_fails_before_network_without_secret(self):
        with self.assertRaisesRegex(ValueError, "IYAAZ_TRANSLATION_API_KEY"):
            provider_from_environment({"IYAAZ_TRANSLATION_PROVIDER": "azure"})

    def test_failed_provider_does_not_replace_existing_artifacts(self):
        class BrokenProvider:
            name = "broken"

            def translate_batch(self, texts: list[str]) -> list[str]:
                raise RuntimeError("provider unavailable")

        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir)
            existing = {
                OVERLAY_NAME: b"old-overlay",
                CACHE_NAME: b"old-cache",
                MANIFEST_NAME: b"old-manifest",
            }
            for name, raw in existing.items():
                (output_dir / name).write_bytes(raw)

            with self.assertRaisesRegex(RuntimeError, "provider unavailable"):
                write_translation_artifacts(
                    [self.sample_record()],
                    output_dir,
                    BrokenProvider(),
                    existing_cache={},
                    source_snapshot_sha256="abc123",
                )

            for name, raw in existing.items():
                self.assertEqual((output_dir / name).read_bytes(), raw)


if __name__ == "__main__":
    unittest.main()
