import '@testing-library/jest-dom/vitest';

// In-memory mock for chrome.storage.local
const mockStorage: Record<string, unknown> = {};

globalThis.chrome = {
  storage: {
    local: {
      get: (async (keys: string | string[] | Record<string, unknown> | null) => {
        if (!keys) return { ...mockStorage };
        if (typeof keys === 'string') {
          return { [keys]: mockStorage[keys] };
        }
        if (Array.isArray(keys)) {
          const res: Record<string, unknown> = {};
          keys.forEach((k) => {
            res[k] = mockStorage[k];
          });
          return res;
        }
        const res: Record<string, unknown> = {};
        for (const [k, defaultVal] of Object.entries(keys)) {
          res[k] = mockStorage[k] !== undefined ? mockStorage[k] : defaultVal;
        }
        return res;
      }) as unknown as typeof chrome.storage.local.get,

      set: (async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
      }) as unknown as typeof chrome.storage.local.set,

      remove: (async (keys: string | string[]) => {
        const kList = Array.isArray(keys) ? keys : [keys];
        kList.forEach((k) => delete mockStorage[k]);
      }) as unknown as typeof chrome.storage.local.remove,

      clear: (async () => {
        for (const key of Object.keys(mockStorage)) {
          delete mockStorage[key];
        }
      }) as unknown as typeof chrome.storage.local.clear,
    },
  },
  alarms: {
    create: (() => {}) as unknown as typeof chrome.alarms.create,
    clear: (async () => true) as unknown as typeof chrome.alarms.clear,
    onAlarm: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false,
    },
  },
  runtime: {
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
    sendMessage: (async () => {}) as unknown as typeof chrome.runtime.sendMessage,
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false,
    },
  },
  sidePanel: {
    setPanelBehavior: (async () => {}) as unknown as typeof chrome.sidePanel.setPanelBehavior,
    open: (async () => {}) as unknown as typeof chrome.sidePanel.open,
  },
} as unknown as typeof chrome;

// Reset mock storage between tests
beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
});
