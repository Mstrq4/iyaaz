from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Iterable

TEXT_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yml", ".yaml"}
ROOT_FILES = {".env.example", "package.json", "proxy.ts"}
ACTIVE_DIRS = ("src", "scripts", ".github/workflows")

PUBLIC_ACCESS_SECRET_RE = re.compile(
    r"NEXT_PUBLIC_[A-Z0-9_]*ACCESS[A-Z0-9_]*SECRET[A-Z0-9_]*",
    re.IGNORECASE,
)
LEGACY_ACCESS_NAMES = ("IYAAZ_PRIVATE_KEY", "IYAAZ_SHARE_SECRET")
USE_CLIENT_RE = re.compile(r"^\s*['\"]use client['\"]\s*;?", re.MULTILINE)
SERVER_ACCESS_IMPORT_RE = re.compile(
    r"(?:from\s+|import\s*\(\s*)['\"][^'\"]*(?:/access/(?:config|server|credential|authorization|api))['\"]",
    re.IGNORECASE,
)
SEO_FORBIDDEN_MARKERS = (
    "credential=",
    "token=",
    "accesstoken",
    "sourceurl",
    "referenceurl",
    "sourcereference",
    "source_reference",
    "المصدر المرجعي",
)
SHARED_MISMATCH_RE = re.compile(r"target\.recordId\s*!==\s*payload\.recordId")
SHARED_MISMATCH_DENY_RE = re.compile(
    r"target\.recordId\s*!==\s*payload\.recordId\s*\)\s*(?:\{\s*)?return\s+denied\s*\(",
    re.DOTALL,
)
PUBLIC_FALLBACK_RE = re.compile(
    r"catch\s*(?:\([^)]*\))?\s*\{[\s\S]{0,240}?return\s+\{\s*mode\s*:\s*['\"]public['\"]",
    re.IGNORECASE,
)


def _is_active_file(root: Path, path: Path) -> bool:
    relative = path.relative_to(root).as_posix()
    if relative in ROOT_FILES:
        return True
    if path.name.startswith("next.config.") and path.parent == root:
        return True
    if not any(relative == directory or relative.startswith(f"{directory}/") for directory in ACTIVE_DIRS):
        return False
    return path.suffix.lower() in TEXT_SUFFIXES


def _iter_active_files(root: Path) -> Iterable[Path]:
    if not root.exists():
        return []
    return (
        path
        for path in root.rglob("*")
        if path.is_file() and _is_active_file(root, path)
    )


def _is_seo_delivery_source(relative: str, text: str) -> bool:
    return (
        relative.startswith("src/lib/seo/")
        or relative.startswith("src/components/seo/")
        or relative in {"src/app/sitemap.ts", "src/app/robots.ts"}
        or (relative.startswith("src/app/") and "generateMetadata" in text)
    )


def _add(findings: list[str], relative: str, message: str) -> None:
    findings.append(f"{relative}: {message}")


def scan_security_boundaries(root: Path) -> list[str]:
    """Return deterministic security-boundary findings without reading process secrets."""

    root = Path(root).resolve()
    findings: list[str] = []
    texts: dict[str, str] = {}

    for path in _iter_active_files(root):
        relative = path.relative_to(root).as_posix()
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        texts[relative] = text

        match = PUBLIC_ACCESS_SECRET_RE.search(text)
        if match:
            _add(findings, relative, f"forbidden public access secret identifier {match.group(0)!r}")

        for legacy_name in LEGACY_ACCESS_NAMES:
            if legacy_name in text:
                _add(findings, relative, f"legacy access secret contract {legacy_name} remains active")

        if USE_CLIENT_RE.search(text):
            if "IYAAZ_ACCESS_SECRET" in text:
                _add(findings, relative, "'use client' source references server-only IYAAZ_ACCESS_SECRET")
            import_match = SERVER_ACCESS_IMPORT_RE.search(text)
            if import_match:
                _add(findings, relative, f"'use client' source imports server access module via {import_match.group(0)!r}")

        if _is_seo_delivery_source(relative, text):
            lowered = text.lower()
            for marker in SEO_FORBIDDEN_MARKERS:
                if marker.lower() in lowered:
                    _add(findings, relative, f"SEO/discovery source contains sensitive marker {marker!r}")
            if "IYAAZ_ACCESS_SECRET" in text:
                _add(findings, relative, "SEO/discovery source references server access secret")

    authorization_path = "src/lib/access/authorization.ts"
    authorization = texts.get(authorization_path)
    if authorization is not None:
        if SHARED_MISMATCH_RE.search(authorization) and not SHARED_MISMATCH_DENY_RE.search(authorization):
            _add(findings, authorization_path, "shared record mismatch does not fail closed through denied(...)")
        if "payload.kind !== 'share'" in authorization and not SHARED_MISMATCH_RE.search(authorization):
            _add(findings, authorization_path, "shared authorization lacks an explicit record mismatch check")

    config_path = "src/lib/access/config.ts"
    config = texts.get(config_path)
    if config is not None and PUBLIC_FALLBACK_RE.search(config):
        _add(findings, config_path, "access configuration catches an error and returns a public fallback")

    return sorted(set(findings))


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    root = Path(args[0]).resolve() if args else Path(__file__).resolve().parents[1]
    findings = scan_security_boundaries(root)
    if findings:
        print("Phase 7 security boundary FAIL:")
        for finding in findings:
            print(f"- {finding}")
        return 1
    print("Phase 7 security boundary PASS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
