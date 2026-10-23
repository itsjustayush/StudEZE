/**
 * StudEZE Background Service Worker (Manifest V3)
 * Handles Side Panel toggling and periodic cleanup alarms.
 * NO AI, NO external cloud calls.
 */

const ALARM_CLEANUP_EXPIRY = 'studeze_cleanup_expired_rough_copy';
const ROUGH_COPY_STORAGE_KEY = 'studeze_rough_copy';

chrome.runtime.onInstalled.addListener(async (details) => {
  // Configure side panel to open on action click where supported
  try {
    if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch (err) {
    console.debug('[StudEZE] sidePanel.setPanelBehavior error:', err);
  }

  // Create periodic alarm for cleaning up expired scratchpad content
  chrome.alarms.create(ALARM_CLEANUP_EXPIRY, {
    periodInMinutes: 30,
  });

  if (details.reason === 'install') {
    console.log('[StudEZE] Extension installed successfully.');
  }
});

// Periodic alarm handler for expired Rough Copy cleanup
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_CLEANUP_EXPIRY) {
    try {
      const data = await chrome.storage.local.get(ROUGH_COPY_STORAGE_KEY);
      const record = data[ROUGH_COPY_STORAGE_KEY] as { expiresAt?: number } | undefined;

      if (record && typeof record.expiresAt === 'number' && Date.now() >= record.expiresAt) {
        await chrome.storage.local.remove(ROUGH_COPY_STORAGE_KEY);
        console.log('[StudEZE] Automatically pruned expired Rough Copy scratchpad.');
      }
    } catch (err) {
      console.warn('[StudEZE] Error during scheduled cleanup:', err);
    }
  }
});

// Action click listener (fallback if openPanelOnActionClick is not supported)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (chrome.sidePanel && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (err) {
    console.warn('[StudEZE] Could not open side panel on click:', err);
  }
});
