from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Phase4SkillTests(unittest.TestCase):
    def test_required_design_skills_are_vendored(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max", "rtl-css"):
            self.assertTrue((ROOT / "skills" / name).is_dir(), name)
            self.assertTrue((ROOT / "skills" / name / "SKILL.md").is_file(), name)

    def test_vendored_phase4_skills_record_provenance(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max"):
            self.assertTrue((ROOT / "skills" / name / "UPSTREAM.md").is_file(), name)


if __name__ == "__main__":
    unittest.main()
