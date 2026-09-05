from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.verify_security_boundaries import scan_security_boundaries

ROOT = Path(__file__).resolve().parents[1]


class Phase7SecurityBoundaryTests(unittest.TestCase):
    def fixture(self, files: dict[str, str]) -> Path:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for relative, content in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        return root

    def assert_has(self, findings: list[str], fragment: str) -> None:
        self.assertTrue(
            any(fragment.lower() in finding.lower() for finding in findings),
            f"expected finding containing {fragment!r}; got {findings!r}",
        )

    def test_current_repository_passes_phase7_security_gate(self):
        self.assertEqual(scan_security_boundaries(ROOT), [])

    def test_public_access_secret_names_and_legacy_contracts_are_rejected(self):
        root = self.fixture({
            ".env.example": "NEXT_PUBLIC_IYAAZ_ACCESS_SECRET=oops\n",
            "src/lib/access/legacy.ts": "const old = process.env.IYAAZ_PRIVATE_KEY ?? process.env.IYAAZ_SHARE_SECRET;\n",
        })
        findings = scan_security_boundaries(root)
        self.assert_has(findings, "NEXT_PUBLIC")
        self.assert_has(findings, "IYAAZ_PRIVATE_KEY")
        self.assert_has(findings, "IYAAZ_SHARE_SECRET")

    def test_use_client_files_cannot_import_server_access_modules_or_reference_server_secret(self):
        root = self.fixture({
            "src/components/BadClient.tsx": "'use client';\nimport { readAccessConfig } from '../lib/access/config';\nconst secret = process.env.IYAAZ_ACCESS_SECRET;\nexport const x = secret;\n",
        })
        findings = scan_security_boundaries(root)
        self.assert_has(findings, "use client")
        self.assert_has(findings, "IYAAZ_ACCESS_SECRET")
        self.assert_has(findings, "access/config")

    def test_seo_delivery_sources_reject_sensitive_url_and_reference_markers(self):
        root = self.fixture({
            "src/lib/seo/metadata.ts": "export const canonical = 'https://example.com/ar?credential=secret-token';\n",
            "src/lib/seo/structured-data.ts": "export const payload = { sourceUrl: 'https://private.example', referenceUrl: 'x' };\n",
        })
        findings = scan_security_boundaries(root)
        self.assert_has(findings, "credential=")
        self.assert_has(findings, "sourceUrl")
        self.assert_has(findings, "referenceUrl")

    def test_shared_record_mismatch_must_fail_closed(self):
        root = self.fixture({
            "src/lib/access/authorization.ts": "export function authorize(target: any, payload: any) {\n  if (target.recordId !== payload.recordId) return { allowed: true };\n  return { allowed: true };\n}\n",
        })
        findings = scan_security_boundaries(root)
        self.assert_has(findings, "record mismatch")

    def test_access_config_cannot_catch_errors_and_fall_back_to_public_mode(self):
        root = self.fixture({
            "src/lib/access/config.ts": "export function readAccessConfig() {\n  try { throw new Error('bad mode'); } catch { return { mode: 'public', secret: null }; }\n}\n",
        })
        findings = scan_security_boundaries(root)
        self.assert_has(findings, "public fallback")

    def test_docs_and_tests_are_not_treated_as_active_runtime_contracts(self):
        root = self.fixture({
            "docs/example.md": "NEXT_PUBLIC_IYAAZ_ACCESS_SECRET=illustrative-only\n",
            "tests/fixture.ts": "const x = 'credential=fixture sourceUrl referenceUrl IYAAZ_PRIVATE_KEY';\n",
        })
        self.assertEqual(scan_security_boundaries(root), [])


if __name__ == "__main__":
    unittest.main()
