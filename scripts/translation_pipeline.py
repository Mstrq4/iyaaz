from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path
from typing import Any, Protocol

from scripts.build_snapshot import sanitize_text

SCHEMA_VERSION = 1
OVERLAY_NAME = "library.en.snapshot.json"
MANIFEST_NAME = "library.en.manifest.json"
CACHE_NAME = "translation-cache.json"
DEFAULT_AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com"

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

Transport = Callable[[str, dict[str, str], bytes], tuple[int, bytes]]
SleepFn = Callable[[float], None]


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

    # The manifest is the commit marker and is replaced last. Readers should only
    # trust overlay/cache pairs whose hashes match the manifest.
    output_dir.mkdir(parents=True, exist_ok=True)
    _atomic_write(output_dir / OVERLAY_NAME, overlay_raw)
    _atomic_write(output_dir / CACHE_NAME, cache_raw)
    _atomic_write(output_dir / MANIFEST_NAME, manifest_raw)
    return manifest


def _urllib_transport(url: str, headers: dict[str, str], body: bytes) -> tuple[int, bytes]:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:  # noqa: S310 - configured HTTPS endpoint
            return int(response.status), response.read()
    except urllib.error.HTTPError as exc:
        return int(exc.code), exc.read()


class AzureTranslatorProvider:
    name = "azure"

    def __init__(
        self,
        *,
        api_key: str,
        region: str = "",
        endpoint: str = DEFAULT_AZURE_ENDPOINT,
        batch_size: int = 100,
        max_retries: int = 2,
        transport: Transport | None = None,
        sleep_fn: SleepFn = time.sleep,
    ) -> None:
        key = api_key.strip()
        if not key:
            raise ValueError("IYAAZ_TRANSLATION_API_KEY is required for Azure Translator")
        if batch_size < 1:
            raise ValueError("translation batch_size must be positive")
        if max_retries < 0:
            raise ValueError("translation max_retries cannot be negative")
        self._api_key = key
        self._region = region.strip()
        self._endpoint = endpoint.strip().rstrip("/") or DEFAULT_AZURE_ENDPOINT
        self._batch_size = batch_size
        self._max_retries = max_retries
        self._transport = transport or _urllib_transport
        self._sleep_fn = sleep_fn

    def _url(self) -> str:
        base = self._endpoint
        if not base.endswith("/translate"):
            base += "/translate"
        query = urllib.parse.urlencode(
            {"api-version": "3.0", "from": "ar", "to": "en"}
        )
        return f"{base}?{query}"

    def _headers(self) -> dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self._api_key,
        }
        if self._region:
            headers["Ocp-Apim-Subscription-Region"] = self._region
        return headers

    def _translate_one_batch(self, texts: list[str]) -> list[str]:
        body = json.dumps(
            [{"Text": text} for text in texts],
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")

        last_status = 0
        raw = b""
        for attempt in range(self._max_retries + 1):
            try:
                status, raw = self._transport(self._url(), self._headers(), body)
            except OSError as exc:
                if attempt >= self._max_retries:
                    raise RuntimeError("Azure Translator request failed") from exc
                self._sleep_fn(0.5 * (2**attempt))
                continue

            last_status = status
            if status == 200:
                break
            if (status == 429 or status >= 500) and attempt < self._max_retries:
                self._sleep_fn(0.5 * (2**attempt))
                continue
            raise RuntimeError(f"Azure Translator returned HTTP {status}")
        else:  # pragma: no cover - loop exits through return/raise/break
            raise RuntimeError(f"Azure Translator failed with HTTP {last_status}")

        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("malformed Azure translation response") from exc
        if not isinstance(payload, list) or len(payload) != len(texts):
            raise ValueError("malformed Azure translation response")

        translations: list[str] = []
        for item in payload:
            if not isinstance(item, Mapping):
                raise ValueError("malformed Azure translation response")
            candidates = item.get("translations")
            if not isinstance(candidates, list) or not candidates:
                raise ValueError("malformed Azure translation response")
            candidate = candidates[0]
            if not isinstance(candidate, Mapping) or not isinstance(candidate.get("text"), str):
                raise ValueError("malformed Azure translation response")
            translations.append(str(candidate["text"]))
        return translations

    def translate_batch(self, texts: list[str]) -> list[str]:
        if not texts:
            return []
        result: list[str] = []
        for start in range(0, len(texts), self._batch_size):
            result.extend(self._translate_one_batch(texts[start : start + self._batch_size]))
        return result


def provider_from_environment(
    environment: Mapping[str, str] | None = None,
) -> TranslationProvider:
    env = environment if environment is not None else os.environ
    provider_name = env.get("IYAAZ_TRANSLATION_PROVIDER", "azure").strip().lower()
    if provider_name != "azure":
        raise ValueError(f"unsupported IYAAZ_TRANSLATION_PROVIDER: {provider_name or '<empty>'}")
    api_key = env.get("IYAAZ_TRANSLATION_API_KEY", "").strip()
    if not api_key:
        raise ValueError("IYAAZ_TRANSLATION_API_KEY is required for translation generation")
    return AzureTranslatorProvider(
        api_key=api_key,
        region=env.get("IYAAZ_TRANSLATION_REGION", ""),
        endpoint=env.get("IYAAZ_TRANSLATION_ENDPOINT", DEFAULT_AZURE_ENDPOINT),
    )


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def run_translation(
    source: Path,
    output_dir: Path,
    *,
    environment: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    raw = source.read_bytes()
    parsed = json.loads(raw.decode("utf-8"))
    if not isinstance(parsed, list):
        raise ValueError("translation source snapshot must be a JSON array")
    cache_path = output_dir / CACHE_NAME
    existing_cache = _load_json(cache_path) if cache_path.exists() else {}
    if not isinstance(existing_cache, Mapping):
        raise ValueError("translation cache must be a JSON object")
    provider = provider_from_environment(environment)
    return write_translation_artifacts(
        parsed,
        output_dir,
        provider,
        existing_cache=existing_cache,
        source_snapshot_sha256=hashlib.sha256(raw).hexdigest(),
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate the static English IYAAZ translation overlay at build/operator time."
    )
    parser.add_argument(
        "--source", type=Path, default=Path("data/library.snapshot.json")
    )
    parser.add_argument("--output-dir", type=Path, default=Path("data"))
    args = parser.parse_args()
    manifest = run_translation(args.source, args.output_dir)
    print(json.dumps(manifest, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()


__all__ = [
    "AzureTranslatorProvider",
    "CACHE_NAME",
    "DEFAULT_AZURE_ENDPOINT",
    "MANIFEST_NAME",
    "OVERLAY_NAME",
    "SCHEMA_VERSION",
    "TRANSLATABLE_FIELDS",
    "TranslationProvider",
    "build_translation_overlay",
    "provider_from_environment",
    "run_translation",
    "source_hash",
    "write_translation_artifacts",
]
