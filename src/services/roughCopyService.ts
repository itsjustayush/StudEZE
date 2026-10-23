import {
  RoughCopyRecord,
  RoughCopyExpiryOption,
  EXPIRY_DURATIONS_MS,
} from '../types/roughCopy';
import { storage } from './storage';

const STORAGE_KEY = 'studeze_rough_copy';
const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_ROUGH_COPY: RoughCopyRecord = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  content: '',
  createdAt: 0,
  updatedAt: 0,
  expiryOption: '24h',
  expiresAt: 0,
  version: 1,
};

export const roughCopyService = {
  /**
   * Loads the Rough Copy record.
   * If content has expired, automatically wipes it from storage and returns clean default.
   */
  async load(): Promise<RoughCopyRecord> {
    const record = await storage.get<RoughCopyRecord | null>(STORAGE_KEY, null);

    if (!record || !record.content) {
      return {
        ...DEFAULT_ROUGH_COPY,
        expiryOption: record?.expiryOption || '24h',
      };
    }

    const now = Date.now();
    // Expiry check
    if (record.expiresAt > 0 && now >= record.expiresAt) {
      // Content has expired! Wipe it immediately
      await this.clear();
      return {
        ...DEFAULT_ROUGH_COPY,
        expiryOption: record.expiryOption || '24h',
      };
    }

    return record;
  },

  /**
   * Saves content. Sets or updates expiresAt based on selected expiry.
   */
  async save(
    content: string,
    expiryOption?: RoughCopyExpiryOption,
    expectedVersion?: number
  ): Promise<RoughCopyRecord> {
    const existing = await this.load();
    const now = Date.now();

    const selectedExpiry = expiryOption || existing.expiryOption || '24h';
    const isFirstEntry = !existing.content && content.length > 0;
    const durationMs = EXPIRY_DURATIONS_MS[selectedExpiry];

    // If starting fresh or changing expiry, calculate new expiresAt from now
    let expiresAt = existing.expiresAt;
    if (isFirstEntry || !expiresAt || expiryOption !== undefined && expiryOption !== existing.expiryOption) {
      expiresAt = now + durationMs;
    }

    if (expectedVersion !== undefined && existing.version > expectedVersion) {
      console.warn(
        `[RoughCopy] Conflict detected: local version ${existing.version} > expected ${expectedVersion}`
      );
    }

    const updatedRecord: RoughCopyRecord = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      content,
      createdAt: existing.createdAt || now,
      updatedAt: now,
      expiryOption: selectedExpiry,
      expiresAt,
      version: existing.version + 1,
    };

    await storage.set<RoughCopyRecord>(STORAGE_KEY, updatedRecord);
    return updatedRecord;
  },

  /**
   * Changes the expiry option and resets the countdown from right now.
   */
  async setExpiryOption(newOption: RoughCopyExpiryOption): Promise<RoughCopyRecord> {
    const current = await this.load();
    const now = Date.now();
    const durationMs = EXPIRY_DURATIONS_MS[newOption];

    const updated: RoughCopyRecord = {
      ...current,
      expiryOption: newOption,
      expiresAt: current.content ? now + durationMs : 0,
      updatedAt: now,
      version: current.version + 1,
    };

    await storage.set<RoughCopyRecord>(STORAGE_KEY, updated);
    return updated;
  },

  /**
   * Clears the scratchpad completely and removes stored record.
   */
  async clear(): Promise<boolean> {
    return await storage.remove(STORAGE_KEY);
  },

  /**
   * Formats human-friendly remaining time string
   */
  getRemainingTimeString(expiresAt: number): {
    label: string;
    isUrgent: boolean;
    isExpired: boolean;
  } {
    if (!expiresAt || expiresAt <= 0) {
      return { label: 'No expiry scheduled', isUrgent: false, isExpired: false };
    }

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      return { label: 'Expired', isUrgent: true, isExpired: true };
    }

    const minutes = Math.floor(remainingMs / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let label = '';
    let isUrgent = false;

    if (days > 0) {
      const remHours = hours % 24;
      label = `${days}d ${remHours}h left`;
    } else if (hours > 0) {
      const remMins = minutes % 60;
      label = `${hours}h ${remMins}m left`;
      if (hours < 2) isUrgent = true;
    } else {
      label = `${Math.max(1, minutes)}m left`;
      isUrgent = true;
    }

    return { label, isUrgent, isExpired: false };
  },
};
