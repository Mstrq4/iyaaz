export { authorizeAccess, type AccessDecision, type AccessTarget } from './authorization.ts';
export { readAccessConfig } from './config.ts';
export { ACCESS_COOKIE, accessCookieOptions } from './cookie.ts';
export { accessCopy, type AccessCopy } from './copy.ts';
export { signAccessCredential, verifyAccessCredential } from './credential.ts';
export { buildLocalizedAccessUrl } from './links.ts';
export type {
  AccessConfig,
  AccessCredentialKind,
  AccessCredentialPayload,
  AccessCredentialScope,
  AccessMode,
} from './types.ts';
