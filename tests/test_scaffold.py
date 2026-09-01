from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ScaffoldTests(unittest.TestCase):
    def test_next_app_has_bilingual_root_structure(self):
        required = [
            ROOT / 'src/app/(root)/layout.tsx',
            ROOT / 'src/app/(root)/page.tsx',
            ROOT / 'src/app/[locale]/layout.tsx',
            ROOT / 'src/app/[locale]/page.tsx',
            ROOT / 'src/app/globals.css',
        ]
        missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
        self.assertEqual(missing, [], f'missing scaffold files: {missing}')


if __name__ == '__main__':
    unittest.main()
