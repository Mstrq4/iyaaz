export interface FavoriteEntry {
  recordId: number;
  savedAt: string;
}

export interface HistoryEntry {
  recordId: number;
  lastOpenedAt: string;
  openCount: number;
}

export interface ClientProfileInput {
  name: string;
  businessDescription: string;
  brandColors: string;
  tone: string;
  constraints: string;
  notes: string;
}

export interface ClientProfile extends ClientProfileInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const WORKSPACE_KEYS = {
  favorites: 'iyaaz:favorites:v1',
  history: 'iyaaz:history:v1',
  clients: 'iyaaz:clients:v1',
} as const;

export const HISTORY_LIMIT = 200;
