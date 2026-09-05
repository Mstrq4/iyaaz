from __future__ import annotations

from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
ICONS = ROOT / "public" / "icons" / "iyaaz-icons.svg"
SVG_NS = "{http://www.w3.org/2000/svg}"

REQUIRED = (
    "mark-gradient.svg",
    "mark-dark.svg",
    "mark-light.svg",
    "favicon.svg",
    "lockup-horizontal-dark.svg",
    "lockup-horizontal-light.svg",
    "lockup-stacked-dark.svg",
    "lockup-stacked-light.svg",
)


def parse_svg(path: Path) -> ET.Element:
    return ET.parse(path).getroot()


class BrandAssetTests(unittest.TestCase):
    def test_required_assets_are_responsive_vector_svg(self) -> None:
        for name in REQUIRED:
            path = BRAND / name
            self.assertTrue(path.is_file(), name)
            root = parse_svg(path)
            self.assertTrue(root.tag.endswith("svg"), name)
            self.assertIn("viewBox", root.attrib, name)
            self.assertNotIn("width", root.attrib, name)
            self.assertNotIn("height", root.attrib, name)
            serialized = path.read_text(encoding="utf-8").lower()
            self.assertNotIn("<image", serialized, name)
            self.assertNotIn("data:image", serialized, name)
            self.assertNotIn("base64,", serialized, name)

    def test_mark_variants_share_one_canonical_geometry(self) -> None:
        cores: list[tuple[str, str]] = []
        for name in ("mark-gradient.svg", "mark-dark.svg", "mark-light.svg"):
            root = parse_svg(BRAND / name)
            self.assertEqual(root.attrib.get("data-geometry"), "iyaaz-ribbon-v2", name)
            ribbon = root.find(f".//{SVG_NS}path[@data-role='ribbon-core']")
            gem = root.find(f".//{SVG_NS}path[@data-role='gem-core']")
            self.assertIsNotNone(ribbon, name)
            self.assertIsNotNone(gem, name)
            cores.append((ribbon.attrib.get("d", ""), gem.attrib.get("d", "")))
        self.assertTrue(cores[0][0])
        self.assertTrue(cores[0][1])
        self.assertEqual(cores[0], cores[1])
        self.assertEqual(cores[0], cores[2])

    def test_gradient_mark_has_depth_without_raster_content(self) -> None:
        root = parse_svg(BRAND / "mark-gradient.svg")
        gradients = list(root.iter(f"{SVG_NS}linearGradient")) + list(root.iter(f"{SVG_NS}radialGradient"))
        self.assertGreaterEqual(len(gradients), 3)
        highlights = root.findall(f".//*[@data-role='highlight']")
        self.assertGreaterEqual(len(highlights), 1)

    def test_lockups_are_vector_outlines_not_font_dependent_text(self) -> None:
        for name in (
            "lockup-horizontal-dark.svg",
            "lockup-horizontal-light.svg",
            "lockup-stacked-dark.svg",
            "lockup-stacked-light.svg",
        ):
            root = parse_svg(BRAND / name)
            self.assertEqual(list(root.iter(f"{SVG_NS}text")), [], name)

    def test_functional_icon_sprite_is_theme_aware_and_raster_free(self) -> None:
        serialized = ICONS.read_text(encoding="utf-8")
        self.assertIn("currentColor", serialized)
        self.assertNotIn("<image", serialized.lower())
        self.assertNotIn("data:image", serialized.lower())


if __name__ == "__main__":
    unittest.main()
