import type { ClientProfile, ClientProfileInput } from './types.ts';

function normalizeInput(input: ClientProfileInput): ClientProfileInput {
  return {
    name: input.name.trim(),
    businessDescription: input.businessDescription.trim(),
    brandColors: input.brandColors.trim(),
    tone: input.tone.trim(),
    constraints: input.constraints.trim(),
    notes: input.notes.trim(),
  };
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function toProfile(value: unknown): ClientProfile | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const stringFields = [
    'id',
    'name',
    'businessDescription',
    'brandColors',
    'tone',
    'constraints',
    'notes',
    'createdAt',
    'updatedAt',
  ] as const;
  if (stringFields.some((field) => typeof candidate[field] !== 'string')) return undefined;
  if (!String(candidate.id).trim() || !isTimestamp(candidate.createdAt) || !isTimestamp(candidate.updatedAt)) {
    return undefined;
  }

  const input = normalizeInput({
    name: String(candidate.name),
    businessDescription: String(candidate.businessDescription),
    brandColors: String(candidate.brandColors),
    tone: String(candidate.tone),
    constraints: String(candidate.constraints),
    notes: String(candidate.notes),
  });

  return {
    id: String(candidate.id).trim(),
    ...input,
    createdAt: String(candidate.createdAt).trim(),
    updatedAt: String(candidate.updatedAt).trim(),
  };
}

export function parseClientProfiles(raw: string): ClientProfile[] {
  if (!raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const profiles: ClientProfile[] = [];
  for (const value of parsed) {
    const profile = toProfile(value);
    if (!profile || seen.has(profile.id)) continue;
    seen.add(profile.id);
    profiles.push(profile);
  }
  return profiles;
}

export function createClientProfile(
  input: ClientProfileInput,
  now: string,
  id: string,
): ClientProfile {
  return {
    id: id.trim(),
    ...normalizeInput(input),
    createdAt: now.trim(),
    updatedAt: now.trim(),
  };
}

export function updateClientProfile(
  profiles: readonly ClientProfile[],
  id: string,
  patch: ClientProfileInput,
  now: string,
): ClientProfile[] {
  const normalizedId = id.trim();
  const normalized = normalizeInput(patch);
  return profiles.map((profile) => profile.id === normalizedId
    ? { ...profile, ...normalized, updatedAt: now.trim() }
    : profile);
}

export function removeClientProfile(
  profiles: readonly ClientProfile[],
  id: string,
): ClientProfile[] {
  const normalizedId = id.trim();
  return profiles.filter((profile) => profile.id !== normalizedId);
}
