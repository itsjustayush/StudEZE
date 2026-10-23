export type RoughCopyExpiryOption = '1h' | '24h' | '7d';

export interface RoughCopyRecord {
  schemaVersion: number;
  content: string;
  createdAt: number;
  updatedAt: number;
  expiryOption: RoughCopyExpiryOption;
  expiresAt: number; // Unix timestamp ms
  version: number;
}

export const EXPIRY_DURATIONS_MS: Record<RoughCopyExpiryOption, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};
