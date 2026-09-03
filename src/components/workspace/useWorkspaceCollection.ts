'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  readWorkspaceRaw,
  removeWorkspaceRaw,
  subscribeWorkspace,
  writeWorkspaceRaw,
} from '../../lib/workspace/storage';

export interface WorkspaceCollectionOptions<T> {
  key: string;
  parse: (raw: string) => T;
  serialize: (value: T) => string;
  empty: T;
}

export function useWorkspaceCollection<T>({
  key,
  parse,
  serialize,
  empty,
}: WorkspaceCollectionOptions<T>): readonly [T, (next: T) => void, () => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeWorkspace(key, onStoreChange),
    [key],
  );
  const getSnapshot = useCallback(() => readWorkspaceRaw(key), [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const value = raw ? parse(raw) : empty;

  const setValue = useCallback((next: T) => {
    writeWorkspaceRaw(key, serialize(next));
  }, [key, serialize]);

  const clear = useCallback(() => {
    removeWorkspaceRaw(key);
  }, [key]);

  return [value, setValue, clear] as const;
}
