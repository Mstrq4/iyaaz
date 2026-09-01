from __future__ import annotations

import json
import re
from collections.abc import Mapping
from typing import Any

URL_PATTERN = re.compile(r"(?i)(?:https?://|www\.)\S+")
WHITESPACE_PATTERN = re.compile(r"\s+")

FIELD_MAP: tuple[tuple[str, str], ...] = (
    ("الرقم", "id"),
    ("الاختصار", "shortcut"),
    ("الاسم العربي", "nameAr"),
    ("المجال الرئيسي", "mainDomain"),
    ("الفئة", "category"),
    ("الفئة الفرعية", "subcategory"),
    ("نوع الاختصار", "shortcutType"),
    ("الوظيفة", "functionText"),
    ("المدخلات المطلوبة", "requiredInputs"),
    ("تعليمات التنفيذ المختصرة", "executionInstructions"),
    ("المخرجات", "outputs"),
    ("المقاس / النسبة", "sizeRatio"),
    ("الخامات / التقنية", "materialsTech"),
    ("الإضاءة", "lighting"),
    ("التثبيت / التنفيذ", "installationExecution"),
    ("الأسلوب البصري", "visualStyle"),
    ("قاعدة الالتزام بالهوية", "brandCompliance"),
    ("الاختصارات المدمجة", "combinedShortcuts"),
    ("أفضل استخدام", "bestUse"),
    ("كلمات مفتاحية", "keywords"),
    ("نوع الأصل", "assetType"),
    ("ملاحظات", "notes"),
)

TEXT_KEYS = tuple(target for _, target in FIELD_MAP if target != "id")


def sanitize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    text = URL_PATTERN.sub("", text)
    return WHITESPACE_PATTERN.sub(" ", text).strip()


def normalize_id(value: Any) -> int:
    if isinstance(value, bool):
        raise ValueError("id must be a positive integer")
    if isinstance(value, int):
        number = value
    elif isinstance(value, float) and value.is_integer():
        number = int(value)
    else:
        text = str(value).strip()
        if not text.isdigit():
            raise ValueError("id must be a positive integer")
        number = int(text)
    if number <= 0:
        raise ValueError("id must be a positive integer")
    return number


def sanitize_row(row: Mapping[str, Any]) -> dict[str, Any]:
    record: dict[str, Any] = {}
    for source_key, target_key in FIELD_MAP:
        raw_value = row.get(source_key)
        record[target_key] = normalize_id(raw_value) if target_key == "id" else sanitize_text(raw_value)

    if not record["shortcut"]:
        raise ValueError("shortcut is required")
    if not record["nameAr"]:
        raise ValueError("nameAr is required")

    assert_safe_record(record)
    return record


def serialize_record(record: Mapping[str, Any]) -> str:
    return json.dumps(dict(record), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def assert_safe_record(record: Mapping[str, Any]) -> None:
    unexpected = set(record) - {target for _, target in FIELD_MAP}
    if unexpected:
        raise ValueError(f"unexpected public fields: {sorted(unexpected)}")

    serialized = serialize_record(record)
    if URL_PATTERN.search(serialized):
        raise ValueError("public record contains a URL")


__all__ = [
    "FIELD_MAP",
    "TEXT_KEYS",
    "assert_safe_record",
    "normalize_id",
    "sanitize_row",
    "sanitize_text",
    "serialize_record",
]
