from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "build_snapshot.py"


def load_module():
    assert MODULE_PATH.exists(), "scripts/build_snapshot.py must exist for Phase 3A"
    spec = spec_from_file_location("build_snapshot", MODULE_PATH)
    assert spec and spec.loader
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


def test_sanitize_row_uses_allowlist_and_removes_source_fields_and_urls():
    module = load_module()
    record = module.sanitize_row(sample_row())

    assert record["id"] == 42
    assert record["shortcut"] == "/StorefrontHero"
    assert record["nameAr"] == "واجهة متجر — هيرو"
    assert record["mainDomain"] == "الواجهات التجارية"
    assert record["category"] == "واجهات المتاجر"
    assert record["subcategory"] == "واجهات حديثة"
    assert record["shortcutType"] == "متخصص"

    serialized = module.serialize_record(record)
    assert "المصدر المرجعي" not in serialized
    assert "source" not in serialized.lower()
    assert "http://" not in serialized.lower()
    assert "https://" not in serialized.lower()
    assert "www." not in serialized.lower()


def test_sanitize_row_preserves_operational_columns_needed_by_the_prompt_builder():
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

    assert set(record) == expected_keys
    assert record["requiredInputs"] == "اسم المتجر، النشاط، المقاس"
    assert record["executionInstructions"] == "استخدم هوية العميل والتزم بالمقاس."
    assert record["notes"] == "راجع ثم أكمل."


def test_sanitize_row_requires_identity_fields():
    module = load_module()
    row = sample_row()
    row["الاختصار"] = ""

    try:
        module.sanitize_row(row)
    except ValueError as exc:
        assert "shortcut" in str(exc)
    else:
        raise AssertionError("sanitize_row must reject rows without a shortcut")
