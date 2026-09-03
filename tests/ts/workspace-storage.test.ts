import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WORKSPACE_CHANGE_EVENT,
  readWorkspaceRaw,
  removeWorkspaceRaw,
  subscribeWorkspace,
  writeWorkspaceRaw,
} from '../../src/lib/workspace/storage.ts';
import { parseFavorites } from '../../src/lib/workspace/favorites.ts';

class FakeStorage {
  readonly values = new Map<string, string>();
  blocked = false;

  getItem(key: string): string | null {
    if (this.blocked) throw new DOMException('blocked', 'SecurityError');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.blocked) throw new DOMException('blocked', 'SecurityError');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.blocked) throw new DOMException('blocked', 'SecurityError');
    this.values.delete(key);
  }
}

class FakeWindow extends EventTarget {
  constructor(readonly localStorage: FakeStorage) {
    super();
  }
}

function installWindow(windowValue?: FakeWindow): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  if (windowValue) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: windowValue,
      writable: true,
    });
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }

  return () => {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  };
}

function dispatchStorage(windowValue: FakeWindow, key: string): void {
  const event = new Event('storage');
  Object.defineProperty(event, 'key', { configurable: true, value: key });
  windowValue.dispatchEvent(event);
}

test('workspace raw reads are SSR-safe and never expose the in-memory fallback on the server', () => {
  const restore = installWindow();
  try {
    assert.equal(readWorkspaceRaw('iyaaz:test:ssr'), '');
  } finally {
    restore();
  }
});

test('workspace raw storage round-trips serialized values in localStorage', () => {
  const storage = new FakeStorage();
  const windowValue = new FakeWindow(storage);
  const restore = installWindow(windowValue);
  const key = 'iyaaz:test:round-trip';
  const raw = JSON.stringify([{ recordId: 3, savedAt: '2026-09-03T00:00:00.000Z' }]);

  try {
    writeWorkspaceRaw(key, raw);
    assert.equal(readWorkspaceRaw(key), raw);
    assert.deepEqual(parseFavorites(readWorkspaceRaw(key)), [
      { recordId: 3, savedAt: '2026-09-03T00:00:00.000Z' },
    ]);
    removeWorkspaceRaw(key);
    assert.equal(readWorkspaceRaw(key), '');
  } finally {
    restore();
  }
});

test('blocked localStorage falls back to module memory without throwing', () => {
  const storage = new FakeStorage();
  storage.blocked = true;
  const windowValue = new FakeWindow(storage);
  const restore = installWindow(windowValue);
  const key = 'iyaaz:test:blocked';

  try {
    assert.doesNotThrow(() => writeWorkspaceRaw(key, 'memory-value'));
    assert.equal(readWorkspaceRaw(key), 'memory-value');
    assert.doesNotThrow(() => removeWorkspaceRaw(key));
    assert.equal(readWorkspaceRaw(key), '');
  } finally {
    restore();
  }
});

test('workspace subscriptions receive same-tab custom events and matching cross-tab storage events only', () => {
  const storage = new FakeStorage();
  const windowValue = new FakeWindow(storage);
  const restore = installWindow(windowValue);
  const key = 'iyaaz:test:events';
  let notifications = 0;

  try {
    const unsubscribe = subscribeWorkspace(key, () => {
      notifications += 1;
    });

    writeWorkspaceRaw(key, 'one');
    assert.equal(notifications, 1, `${WORKSPACE_CHANGE_EVENT} should notify the writing tab`);

    writeWorkspaceRaw('iyaaz:test:other', 'ignored');
    assert.equal(notifications, 1);

    dispatchStorage(windowValue, key);
    assert.equal(notifications, 2, 'matching native storage event should notify subscribers');

    dispatchStorage(windowValue, 'iyaaz:test:other');
    assert.equal(notifications, 2);

    unsubscribe();
    writeWorkspaceRaw(key, 'two');
    assert.equal(notifications, 2, 'unsubscribe should detach both event channels');
  } finally {
    restore();
  }
});

test('malformed serialized workspace collections parse to a safe empty array', () => {
  assert.deepEqual(parseFavorites('{not-json'), []);
  assert.deepEqual(parseFavorites(JSON.stringify({ recordId: 3 })), []);
});
