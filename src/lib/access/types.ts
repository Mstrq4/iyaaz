export type AccessMode = 'public' | 'private' | 'shared';
export type AccessCredentialKind = 'private' | 'share';
export type AccessCredentialScope = 'app' | 'shortcut';

export interface AccessCredentialPayload {
  v: 1;
  kind: AccessCredentialKind;
  exp: number;
  iat: number;
  scope: AccessCredentialScope;
  recordId?: number;
}

export interface AccessConfig {
  mode: AccessMode;
  secret: string | null;
  siteUrl: URL;
}
