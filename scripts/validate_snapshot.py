from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data' / 'library.manifest.json'


def main() -> int:
    if not MANIFEST.exists():
        print('Snapshot validation deferred to phase 3: manifest not present yet.')
        return 0
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not isinstance(data, dict):
        raise SystemExit('library.manifest.json must be an object')
    print('Snapshot manifest structure PASS.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
