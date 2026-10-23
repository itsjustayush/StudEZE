import { describe, it, expect, beforeEach } from 'vitest';
import { roughCopyService } from '../services/roughCopyService';

describe('Rough Copy Scratchpad Service', () => {
  beforeEach(async () => {
    await roughCopyService.clear();
  });

  it('loads clean default when storage is empty', async () => {
    const record = await roughCopyService.load();
    expect(record.content).toBe('');
    expect(record.expiryOption).toBe('24h');
    expect(record.expiresAt).toBe(0);
  });

  it('saves content and sets expiresAt based on expiry option', async () => {
    const beforeTime = Date.now();
    const saved = await roughCopyService.save('Important snippet', '1h');

    expect(saved.content).toBe('Important snippet');
    expect(saved.expiryOption).toBe('1h');
    expect(saved.expiresAt).toBeGreaterThanOrEqual(beforeTime + 59 * 60 * 1000);
    expect(saved.version).toBeGreaterThan(1);

    const reloaded = await roughCopyService.load();
    expect(reloaded.content).toBe('Important snippet');
    expect(reloaded.expiresAt).toBe(saved.expiresAt);
  });

  it('automatically prunes and deletes content on load if expired', async () => {
    // Manually simulate a record that expired in the past
    await roughCopyService.save('Old expired scratch', '1h');

    // Force expired timestamp in storage
    const pastTime = Date.now() - 5000;
    await chrome.storage.local.set({
      studeze_rough_copy: {
        schemaVersion: 1,
        content: 'Old expired scratch',
        createdAt: pastTime - 3600000,
        updatedAt: pastTime - 3600000,
        expiryOption: '1h',
        expiresAt: pastTime,
        version: 2,
      },
    });

    // Loading now should detect expiry, wipe storage, and return empty default
    const result = await roughCopyService.load();
    expect(result.content).toBe('');
    expect(result.expiresAt).toBe(0);

    // Verify storage was wiped
    const inStorage = await chrome.storage.local.get('studeze_rough_copy');
    expect(inStorage.studeze_rough_copy).toBeUndefined();
  });

  it('resets timer from now when expiry option is changed', async () => {
    await roughCopyService.save('Draft thoughts', '24h');

    const beforeChange = Date.now();
    const updated = await roughCopyService.setExpiryOption('7d');

    expect(updated.expiryOption).toBe('7d');
    const expectedExpiryMin = beforeChange + 6.9 * 24 * 60 * 60 * 1000;
    expect(updated.expiresAt).toBeGreaterThan(expectedExpiryMin);
  });

  it('generates friendly remaining time strings', () => {
    const in30Mins = Date.now() + 30 * 60 * 1000;
    const res30m = roughCopyService.getRemainingTimeString(in30Mins);
    expect(res30m.label).toContain('m left');
    expect(res30m.isUrgent).toBe(true);

    const in5Hours = Date.now() + 5 * 60 * 60 * 1000;
    const res5h = roughCopyService.getRemainingTimeString(in5Hours);
    expect(res5h.label).toContain('h');
    expect(res5h.isUrgent).toBe(false);

    const past = Date.now() - 1000;
    const resExpired = roughCopyService.getRemainingTimeString(past);
    expect(resExpired.label).toBe('Expired');
    expect(resExpired.isExpired).toBe(true);
  });
});
