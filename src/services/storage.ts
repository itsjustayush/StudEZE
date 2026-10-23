/**
 * Storage service providing safe access to chrome.storage.local
 * with fallback to localStorage for test/browser-preview environments.
 */

const isChromeStorageAvailable = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.local &&
    typeof chrome.storage.local.get === 'function'
  );
};

export const storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (isChromeStorageAvailable()) {
        const result = await chrome.storage.local.get(key);
        return result[key] !== undefined ? (result[key] as T) : defaultValue;
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : defaultValue;
      }
      return defaultValue;
    } catch (err) {
      console.warn(`[StudEZE Storage] Error reading key "${key}":`, err);
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.set({ [key]: value });
        return true;
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[StudEZE Storage] Error writing key "${key}":`, err);
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.remove(key);
        return true;
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[StudEZE Storage] Error removing key "${key}":`, err);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.clear();
        return true;
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[StudEZE Storage] Error clearing storage:', err);
      return false;
    }
  },
};
