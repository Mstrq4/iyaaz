import { buildLocalizedAccessUrl, readAccessConfig, signAccessCredential } from '../src/lib/access/index.ts';
import type { AccessCredentialPayload } from '../src/lib/access/types.ts';

type LinkKind = 'private' | 'share';
type Locale = 'ar' | 'en';

interface CliOptions {
  kind: LinkKind;
  expiresIn: number;
  locale: Locale;
  recordId?: number;
}

function parsePositiveInteger(value: string | undefined, label: string): number {
  if (!value || !/^\d+$/.test(value)) throw new Error(`${label} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive safe integer`);
  return parsed;
}

function readFlag(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  if (args.indexOf(name, index + 1) !== -1) throw new Error(`${name} may be provided only once`);
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function parseArgs(args: readonly string[]): CliOptions {
  const knownFlags = new Set(['--kind', '--expires-in', '--locale', '--record-id']);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (!flag || !knownFlags.has(flag)) throw new Error(`Unknown access-link argument: ${flag ?? ''}`);
    if (index + 1 >= args.length) throw new Error(`${flag} requires a value`);
  }

  const kind = readFlag(args, '--kind');
  if (kind !== 'private' && kind !== 'share') throw new Error('--kind must be private or share');

  const locale = readFlag(args, '--locale');
  if (locale !== 'ar' && locale !== 'en') throw new Error('--locale must be ar or en');

  const expiresIn = parsePositiveInteger(readFlag(args, '--expires-in'), '--expires-in');
  const recordIdRaw = readFlag(args, '--record-id');

  if (kind === 'share') {
    return {
      kind,
      locale,
      expiresIn,
      recordId: parsePositiveInteger(recordIdRaw, '--record-id'),
    };
  }

  if (recordIdRaw !== undefined) throw new Error('--record-id is valid only for share links');
  return { kind, locale, expiresIn };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const config = readAccessConfig({
    ...process.env,
    IYAAZ_ACCESS_MODE: 'private',
  });
  if (!config.secret) throw new Error('IYAAZ_ACCESS_SECRET is required');

  const now = Math.floor(Date.now() / 1000);
  const exp = now + options.expiresIn;
  if (!Number.isSafeInteger(exp)) throw new Error('Credential expiry is outside the safe integer range');

  const payload: AccessCredentialPayload = options.kind === 'private'
    ? { v: 1, kind: 'private', iat: now, exp, scope: 'app' }
    : { v: 1, kind: 'share', iat: now, exp, scope: 'shortcut', recordId: options.recordId! };

  const credential = signAccessCredential(payload, config.secret);
  const url = buildLocalizedAccessUrl({
    siteUrl: config.siteUrl,
    locale: options.locale,
    credential,
  });
  process.stdout.write(`${url.href}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unable to generate access link';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
