from __future__ import annotations

import hashlib
import json
import os
import tempfile
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, Protocol

from scripts.build_snapshot import sanitize_text

SCHEMA_VERSION = 1
OVERLAY_NAME = "library.en.snapshot.json"
MANIFEST_NAME = "library.en.manifest.json"
CACHE_NAME = "translation-cache.json"

TRANSLATABLE_FIELDS: tuple[str, ...] = (
    "nameAr",
    "mainDomain",
    "category",
    "subcategory",
    "shortcutType",
    "functionText",
    "requiredInputs",
    "executionInstructions",
    "outputs",
    "materialsTech",
    "lighting",
    "installationExecution",
    "visualStyle",
    "brandCompliance",
    "bestUse",
    "keywords",
    "assetType",
    "notes",
)


class TranslationProvider(Protocol):
    name: str

    def translate_batch(self, texts: list[str]) -> list[str]: ...


def source_hash(value: str) -> str:
    normalized = sanitize_text(value)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _cache_key(record_id: int, field: str) -> str:
    return f"{record_id}:{field}"


def _normalize_cache(cache: Mapping[str, Any] | None) -> dict[str, dict[str, str]]:
    normalized: dict[str, dict[str, str]] = {}
    for key, value in (cache or {}).items():
        if not isinstance(key, str) or not isinstance(value, Mapping):
            continue
        source_sha = value.get("sourceSha256")
        translation = value.get("translation")
        if isinstance(source_sha, str) and isinstance(translation, str):
            normalized[key] = {
                "sourceSha256": source_sha,
                "translation": sanitize_text(translation),
            }
    return normalized


def build_translation_overlay(
    records: Sequence[Mapping[str, Any]],
    existing_cache: Mapping[str, Any] | None,
    provider: TranslationProvider,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, str]]]:
    cache = _normalize_cache(existing_cache)
    overlay: list[dict[str, Any]] = []
    pending: list[tuple[int, str, str, str]] = []

    for record in records:
        record_id = int(record["id"])
        shortcut = sanitize_text(record.get("shortcut", ""))
        if record_id < 1 or not shortcut:
            raise ValueError("translation source records require positive id and shortcut")
        localized: dict[str, Any] = {"id": record_id, "shortcut": shortcut}
        overlay.append(localized)

        for field in TRANSLATABLE_FIELDS:
            source = sanitize_text(record.get(field, ""))
            if not source:
                localized[field] = ""
                continue
            digest = source_hash(source)
            key = _cache_key(record_id, field)
            cached = cache.get(key)
            if cached and cached.get("sourceSha256") == digest:
                localized[field] = sanitize_text(cached.get("translation", ""))
                continue
            pending.append((len(overlay) - 1, field, source, digest))

    if pending:
        translated = provider.translate_batch([item[2] for item in pending])
        if len(translated) != len(pending):
            raise ValueError(
                f"translation provider returned {len(translated)} values for {len(pending)} inputs"
            )
        for (overlay_index, field, source, digest), raw_translation in zip(
            pending, translated, strict=True
        ):
            if not isinstance(raw_translation, str):
                raise ValueError("translation provider returned a non-string value")
            translation = sanitize_text(raw_translation)
            if source and not translation:
                raise ValueError("translation provider returned an empty translation")
            record_id = int(overlay[overlay_index]["id"])
            overlay[overlay_index][field] = translation
            cache[_cache_key(record_id, field)] = {
                "sourceSha256": digest,
                "translation": translation,
            }

    overlay.sort(key=lambda item: int(item["id"]))
    return overlay, dict(sorted(cache.items()))


def _json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _atomic_write(path: Path, raw: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
        temporary.replace(path)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise


def write_translation_artifacts(
    records: Sequence[Mapping[str, Any]],
    output_dir: Path,
    provider: TranslationProvider,
    *,
    existing_cache: Mapping[str, Any] | None,
    source_snapshot_sha256: str,
) -> dict[str, Any]:
    overlay, cache = build_translation_overlay(records, existing_cache, provider)
    overlay_raw = _json_bytes(overlay)
    cache_raw = _json_bytes(cache)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "format": "json",
        "file": OVERLAY_NAME,
        "cacheFile": CACHE_NAME,
        "recordCount": len(overlay),
        "translatedFieldCount": len(TRANSLATABLE_FIELDS),
        "provider": str(provider.name),
        "sourceSnapshotSha256": source_snapshot_sha256,
        "sha256": hashlib.sha256(overlay_raw).hexdigest(),
        "cacheSha256": hashlib.sha256(cache_raw).hexdigest(),
    }
    manifest_raw = json.dumps(
        manifest, ensure_ascii=False, sort_keys=True, indent=2
    ).encode("utf-8") + b"\n"

    output_dir.mkdir(parents=True, exist_ok=True)
    _atomic_write(output_dir / OVERLAY_NAME, overlay_raw)
    _atomic_write(output_dir / CACHE_NAME, cache_raw)
    _atomic_write(output_dir / MANIFEST_NAME, manifest_raw)
    return manifest


__all__ = [
    "CACHE_NAME",
    "MANIFEST_NAME",
    "OVERLAY_NAME",
    "SCHEMA_VERSION",
    "TRANSLATABLE_FIELDS",
    "TranslationProvider",
    "build_translation_overlay",
    "source_hash",
    "write_translation_artifacts",
]
