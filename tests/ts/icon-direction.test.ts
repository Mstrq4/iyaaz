import assert from 'node:assert/strict';
import test from 'node:test';
import { isDirectionalIcon } from '../../src/lib/icons.ts';

test('only semantic navigation arrows mirror in RTL', () => {
  assert.equal(isDirectionalIcon('arrow'), true);
  assert.equal(isDirectionalIcon('chevron'), true);
  for (const name of ['search', 'copy', 'favorite', 'theme', 'grid', 'list', 'external'] as const) {
    assert.equal(isDirectionalIcon(name), false, name);
  }
});
