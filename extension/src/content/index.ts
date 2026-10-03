import { ChatGPTAdapter } from "./adapters/chatgpt";
import { GeminiAdapter } from "./adapters/gemini";
import { SelectorConfig, SiteAdapter } from "./adapters/types";
import { clearHighlights, highlightQuotesInElement, injectFloatingButton } from "./highlighter";

let currentAdapter: SiteAdapter | null = null;
const url = new URL(window.location.href);

const chatgptAdapter = new ChatGPTAdapter();
const geminiAdapter = new GeminiAdapter();

if (chatgptAdapter.matches(url)) {
  currentAdapter = chatgptAdapter;
} else if (geminiAdapter.matches(url)) {
  currentAdapter = geminiAdapter;
}

// Load cached selectors from storage if available
if (chrome?.storage?.local) {
  chrome.storage.local.get(["cached_selectors"], (res) => {
    if (res.cached_selectors) {
      const cfg = res.cached_selectors as SelectorConfig;
      if (chatgptAdapter && cfg.chatgpt) {
        chatgptAdapter.updateSelectors(cfg.chatgpt);
      }
      if (geminiAdapter && cfg.gemini) {
        geminiAdapter.updateSelectors(cfg.gemini);
      }
    }
  });
}

// Inject floating button if adapter matched
if (currentAdapter) {
  setTimeout(() => {
    injectFloatingButton();
  }, 1000);
}

// Message Listener for Side Panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!currentAdapter) {
    if (message.type === "PING") {
      sendResponse({ site: null, ready: false });
    } else {
      sendResponse({ ok: false, error: "UNSUPPORTED_SITE" });
    }
    return true;
  }

  switch (message.type) {
    case "PING":
      sendResponse({
        site: currentAdapter.id,
        ready: currentAdapter.isReady(),
        url: window.location.href,
      });
      break;

    case "IS_GENERATING":
      sendResponse({
        generating: currentAdapter.isGenerating(),
      });
      break;

    case "INSERT_PROMPT":
      currentAdapter
        .insertPrompt(message.text)
        .then((result) => sendResponse(result))
        .catch((err) => {
          sendResponse({ ok: false, error: "INSERT_FAILED", detail: String(err) });
        });
      return true; // async response

    case "READ_LAST_ANSWER":
      currentAdapter
        .getLastAssistantMessage()
        .then((result) => sendResponse(result))
        .catch((err) => {
          sendResponse({
            ok: false,
            error: "NO_ASSISTANT_MESSAGE",
            detail: String(err),
          });
        });
      return true; // async response

    case "HIGHLIGHT_QUOTES":
      try {
        const el = currentAdapter.getLastAssistantElement();
        if (el && message.items) {
          highlightQuotesInElement(el, message.items);
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: false, reason: "NO_ELEMENT" });
        }
      } catch (err: any) {
        sendResponse({ ok: false, error: err.message });
      }
      break;

    case "CLEAR_HIGHLIGHTS":
      clearHighlights();
      sendResponse({ ok: true });
      break;

    case "GET_CHAT_URL":
      sendResponse({ url: window.location.href });
      break;

    default:
      sendResponse({ ok: false, error: "UNKNOWN_MESSAGE_TYPE" });
  }

  return true;
});
