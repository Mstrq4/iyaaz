'use client';

import { useEffect, useRef } from 'react';

import { parseHistory, recordHistory } from '../../lib/workspace/history';
import { readWorkspaceRaw, writeWorkspaceRaw } from '../../lib/workspace/storage';
import { WORKSPACE_KEYS } from '../../lib/workspace/types';

export function HistoryRecorder({ recordId }: { recordId: number }) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const current = parseHistory(readWorkspaceRaw(WORKSPACE_KEYS.history));
    const next = recordHistory(current, recordId, new Date().toISOString());
    writeWorkspaceRaw(WORKSPACE_KEYS.history, JSON.stringify(next));
  }, [recordId]);

  return null;
}
