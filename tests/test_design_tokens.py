from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "src" / "styles" / "tokens.css"
GLOBALS = ROOT / "src" / "app" / "globals.css"
MASTER = ROOT / "design-system" / "iyaaz" / "MASTER.md"


def _hex_to_rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4))


def _relative_luminance(value: str) -> float:
    channels = []
    for channel in _hex_to_rgb(value):
        channels.append(channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4)
    red, green, blue = channels
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def _contrast_ratio(foreground: str, background: str) -> float:
    first = _relative_luminance(foreground)
    second = _relative_luminance(background)
    light, dark = max(first, second), min(first, second)
    return (light + 0.05) / (dark + 0.05)


def _extract_hex(css: str, selector: str, variable: str) -> str:
    selector_pattern = re.escape(selector)
    block_match = re.search(rf"{selector_pattern}\s*\{{(?P<body>.*?)\}}", css, re.S)
    if not block_match:
        raise AssertionError(f"missing selector: {selector}")
    value_match = re.search(rf"{re.escape(variable)}\s*:\s*(#[0-9a-fA-F]{{6}})\s*;", block_match.group("body"))
    if not value_match:
        raise AssertionError(f"missing hex token {variable} in {selector}")
    return value_match.group(1)


class Phase4BDesignTokenTests(unittest.TestCase):
    def setUp(self) -> None:
        self.assertTrue(TOKENS.is_file(), "src/styles/tokens.css must exist for Phase 4B")
        self.css = TOKENS.read_text(encoding="utf-8")

    def test_locked_brand_colors_and_semantic_token_families_exist(self) -> None:
        self.assertIn("--brand-amethyst: #3e1848;", self.css.lower())
        self.assertIn("--brand-whisper-lavender: #e7e6f5;", self.css.lower())

        required_tokens = (
            "--color-bg-canvas",
            "--color-bg-subtle",
            "--color-surface-glass",
            "--color-surface-solid",
            "--color-text-primary",
            "--color-text-secondary",
            "--color-border-subtle",
            "--color-focus-ring",
            "--font-display",
            "--font-body",
            "--space-1",
            "--space-12",
            "--radius-sm",
            "--radius-xl",
            "--motion-fast",
            "--motion-standard",
            "--content-reading",
            "--content-shell",
            "--touch-target",
        )
        for token in required_tokens:
            self.assertIn(token, self.css, token)

        self.assertIn('[data-theme="dark"]', self.css)

    def test_primary_secondary_text_and_focus_contrast_meet_accessibility_targets(self) -> None:
        for selector in (":root", '[data-theme="dark"]'):
            background = _extract_hex(self.css, selector, "--color-bg-canvas")
            primary = _extract_hex(self.css, selector, "--color-text-primary")
            secondary = _extract_hex(self.css, selector, "--color-text-secondary")
            focus = _extract_hex(self.css, selector, "--color-focus-ring")

            self.assertGreaterEqual(_contrast_ratio(primary, background), 4.5, f"{selector} primary")
            self.assertGreaterEqual(_contrast_ratio(secondary, background), 4.5, f"{selector} secondary")
            self.assertGreaterEqual(_contrast_ratio(focus, background), 3.0, f"{selector} focus")

    def test_typography_uses_local_thmanyah_without_shipping_font_binaries(self) -> None:
        lowered = self.css.lower()
        self.assertIn("local(\"thmanyah serif display\")", lowered)
        self.assertIn("font-display: swap", lowered)
        self.assertNotIn("url(", lowered)
        for extension in (".woff", ".woff2", ".ttf", ".otf"):
            self.assertNotIn(extension, lowered)

    def test_reduced_motion_global_consumption_and_design_system_record_are_present(self) -> None:
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)
        globals_css = GLOBALS.read_text(encoding="utf-8")
        self.assertIn('@import "../styles/tokens.css";', globals_css)
        self.assertIn("var(--font-body)", globals_css)
        self.assertIn("var(--color-bg-canvas)", globals_css)
        self.assertIn("var(--color-text-primary)", globals_css)

        self.assertTrue(MASTER.is_file(), "design-system/iyaaz/MASTER.md must document Phase 4B decisions")
        master = MASTER.read_text(encoding="utf-8").lower()
        self.assertIn("#3e1848", master)
        self.assertIn("#e7e6f5", master)
        self.assertIn("thmanyah serif display", master)
        self.assertIn("semantic tokens", master)


if __name__ == "__main__":
    unittest.main()
