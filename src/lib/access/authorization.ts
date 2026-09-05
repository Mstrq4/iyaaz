import { verifyAccessCredential } from './credential.ts';
import type { AccessConfig, AccessCredentialPayload } from './types.ts';

export type AccessTarget =
  | { kind: 'app' }
  | { kind: 'shortcut'; recordId: number }
  | { kind: 'api' };

export type AccessDecision =
  | { allowed: true; payload: AccessCredentialPayload | null }
  | { allowed: false; status: 401 | 404; reason: 'missing' | 'invalid' | 'scope' | 'record' | 'mode' };

function denied(mode: AccessConfig['mode'], reason: AccessDecision extends infer _T ? 'missing' | 'invalid' | 'scope' | 'record' | 'mode' : never): AccessDecision {
  return {
    allowed: false,
    status: mode === 'private' ? 401 : 404,
    reason,
  };
}

export function authorizeAccess(options: {
  config: AccessConfig;
  token: string | undefined;
  target: AccessTarget;
  nowSeconds?: number;
}): AccessDecision {
  const { config, token, target, nowSeconds } = options;

  if (config.mode === 'public') {
    return { allowed: true, payload: null };
  }

  if (!config.secret) return denied(config.mode, 'mode');
  if (!token) return denied(config.mode, 'missing');

  const payload = verifyAccessCredential(token, config.secret, nowSeconds);
  if (!payload) return denied(config.mode, 'invalid');

  if (config.mode === 'private') {
    if (payload.kind !== 'private' || payload.scope !== 'app' || payload.recordId !== undefined) {
      return denied(config.mode, 'scope');
    }
    return { allowed: true, payload };
  }

  if (payload.kind !== 'share' || payload.scope !== 'shortcut' || payload.recordId === undefined) {
    return denied(config.mode, 'scope');
  }

  if (target.kind !== 'shortcut') return denied(config.mode, 'scope');
  if (target.recordId !== payload.recordId) return denied(config.mode, 'record');

  return { allowed: true, payload };
}
