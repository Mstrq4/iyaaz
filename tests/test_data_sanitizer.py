from __future__ import annotations

import unittest
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "build_snapshot.py"


def load_module():
    if not MODULE_PATH.exists():
        raise AssertionError("scripts/build_snapshot.py must exist for Phase 3A")
    spec = spec_from_file_location("build_snapshot", MODULE_PATH)
    if not spec or not spec.loader:
        raise AssertionError("Unable to load scripts/build_snapshot.py")
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sample_row() -> dict[str, object]:
    return {
        "الرقم": 42,
        "الاختصار": "/StorefrontHero",
        "الاسم العربي": "واجهة متجر — هيرو",
        "المجال الرئيسي": "الواجهات التجارية",
        "الفئة": "واجهات المتاجر",
        "الفئة الفرعية": "واجهات حديثة",
        "نوع الاختصار": "متخصص",
        "الوظيفة": "تجهيز وصف واجهة متجر حديثة.",
        "المدخلات المطلوبة": "اسم المتجر، النشاط، المقاس",
        "تعليمات التنفيذ المختصرة": "استخدم هوية العميل والتزم بالمقاس.",
        "المخرجات": "نص جاهز",
        "المقاس / النسبة": "16:9",
        "الخامات / التقنية": "ACP + Acrylic",
        "الإضاءة": "LED",
        "التثبيت / التنفيذ": "حروف بارزة",
        "الأسلوب البصري": "حديث",
        "قاعدة الالتزام بالهوية": "إلزامي",
        "الاختصارات المدمجة": "",
        "أفضل استخدام": "واجهات محلات الجوالات",
        "كلمات مفتاحية": "واجهة، متجر، storefront",
        "نوع الأصل": "واجهة",
        "المصدر المرجعي": "https://example.com/private-source",
        "ملاحظات": "راجع https://example.com/hidden ثم أكمل.",
    }


class DataSanitizerContractTests(unittest.TestCase):
    def test_sanitize_row_uses_allowlist_and_removes_source_fields_and_urls(self):
        module = load_module()
        record = module.sanitize_row(sample_row())

        self.assertEqual(record["id"], 42)
        self.assertEqual(record["shortcut"], "/StorefrontHero")
        self.assertEqual(record["nameAr"], "واجهة متجر — هيرو")
        self.assertEqual(record["mainDomain"], "الواجهات التجارية")
        self.assertEqual(record["category"], "واجهات المتاجر")
        self.assertEqual(record["subcategory"], "واجهات حديثة")
        self.assertEqual(record["shortcutType"], "متخصص")

        serialized = module.serialize_record(record)
        self.assertNotIn("المصدر المرجعي", serialized)
        self.assertNotIn("source", serialized.lower())
        self.assertNotIn("http://", serialized.lower())
        self.assertNotIn("https://", serialized.lower())
        self.assertNotIn("www.", serialized.lower())

    def test_sanitize_row_preserves_operational_columns_needed_by_prompt_builder(self):
        module = load_module()
        record = module.sanitize_row(sample_row())

        expected_keys = {
            "id",
            "shortcut",
            "nameAr",
            "mainDomain",
            "category",
            "subcategory",
            "shortcutType",
            "functionText",
            "requiredInputs",
            "executionInstructions",
            "outputs",
            "sizeRatio",
            "materialsTech",
            "lighting",
            "installationExecution",
            "visualStyle",
            "brandCompliance",
            "combinedShortcuts",
            "bestUse",
            "keywords",
            "assetType",
            "notes",
        }

        self.assertEqual(set(record), expected_keys)
        self.assertEqual(record["requiredInputs"], "اسم المتجر، النشاط، المقاس")
        self.assertEqual(record["executionInstructions"], "استخدم هوية العميل والتزم بالمقاس.")
        self.assertEqual(record["notes"], "راجع ثم أكمل.")

    def test_sanitize_row_requires_identity_fields(self):
        module = load_module()
        row = sample_row()
        row["الاختصار"] = ""

        with self.assertRaisesRegex(ValueError, "shortcut"):
            module.sanitize_row(row)


if __name__ == "__main__":
    unittest.main()
