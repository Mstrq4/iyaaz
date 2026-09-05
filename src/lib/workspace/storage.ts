export const WORKSPACE_CHANGE_EVENT = 'iyaaz:workspace-change';

const memoryRaw = new Map<string, string>();

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function notifyWorkspaceChange(key: string): void {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT, { detail: key }));
}

export function readWorkspaceRaw(key: string): string {
  if (!hasWindow()) return '';

  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return memoryRaw.get(key) ?? '';
  }
}

export function writeWorkspaceRaw(key: string, raw: string): void {
  if (!hasWindow()) return;

  memoryRaw.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // Keep the in-memory value when persistent storage is unavailable.
  }
  notifyWorkspaceChange(key);
}

export function removeWorkspaceRaw(key: string): void {
  if (!hasWindow()) return;

  memoryRaw.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Removing the in-memory fallback is still a successful logical clear.
  }
  notifyWorkspaceChange(key);
}

export function subscribeWorkspace(key: string, onStoreChange: () => void): () => void {
  if (!hasWindow()) return () => undefined;

  const handleWorkspaceChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) onStoreChange();
  };
  const handleStorage = (event: Event) => {
    if ((event as StorageEvent).key === key) onStoreChange();
  };

  window.addEventListener(WORKSPACE_CHANGE_EVENT, handleWorkspaceChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(WORKSPACE_CHANGE_EVENT, handleWorkspaceChange);
    window.removeEventListener('storage', handleStorage);
  };
}
