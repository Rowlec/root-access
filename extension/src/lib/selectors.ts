import { api } from "./api";

const DEFAULT_SELECTORS = {
  version: 1,
  chatgpt: {
    input: ["#prompt-textarea", "div[contenteditable='true']"],
    assistantMessage: ["[data-message-author-role='assistant']"],
    stopButton: ["button[data-testid='stop-button']"],
  },
  gemini: {
    input: ["rich-textarea .ql-editor", "div[contenteditable='true']"],
    assistantMessage: ["model-response message-content", "model-response"],
    stopButton: ["button[aria-label*='Stop']", "button[aria-label*='Dừng']"],
  },
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (Mục 5.4)

export async function getSiteSelectors() {
  if (!chrome?.storage?.local) {
    return DEFAULT_SELECTORS;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(["cached_selectors", "cached_selectors_at"], async (res) => {
      const now = Date.now();
      if (
        res.cached_selectors &&
        res.cached_selectors_at &&
        now - res.cached_selectors_at < CACHE_TTL_MS
      ) {
        resolve(res.cached_selectors);
        return;
      }

      // Fetch fresh from backend
      try {
        const fresh = await api.getSelectors();
        chrome.storage.local.set({
          cached_selectors: fresh,
          cached_selectors_at: now,
        });
        resolve(fresh);
      } catch {
        resolve(res.cached_selectors || DEFAULT_SELECTORS);
      }
    });
  });
}
