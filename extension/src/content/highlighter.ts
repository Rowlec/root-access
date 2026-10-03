// In-page quote highlighter and floating button for ChatGPT / Gemini
// Spec Mục 5.1: Gạch chân trên trang

export interface HighlightItem {
  id: string;
  evidence_quote: string;
  level: "CHUA_DAT" | "DAT" | "TOT";
  reason: string;
}

let activeObserver: MutationObserver | null = null;

// Normalize text for fuzzy matching
function normalizeText(str: string): string {
  return str
    .replace(/[*#`_~]/g, "") // Strip Markdown formatting
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Clear all injected marks and restore original text
export function clearHighlights(targetEl?: HTMLElement | null) {
  const root = targetEl || document.body;
  const marks = root.querySelectorAll("mark[data-ra]");
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    }
  });
}

// Highlight quotes in the assistant message element
export function highlightQuotesInElement(
  targetEl: HTMLElement,
  items: HighlightItem[],
) {
  clearHighlights(targetEl);

  if (!items || items.length === 0) return;

  // Filter items that have meaningful evidence_quote
  const validItems = items.filter(
    (item) => item.evidence_quote && item.evidence_quote.trim().length >= 10,
  );

  if (validItems.length === 0) return;

  // Inject CSS for highlights if not present
  if (!document.getElementById("ra-highlight-styles")) {
    const style = document.createElement("style");
    style.id = "ra-highlight-styles";
    style.textContent = `
      mark[data-ra] {
        border-radius: 4px;
        padding: 2px 4px;
        cursor: pointer;
        position: relative;
        font-weight: inherit;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        transition: opacity 0.2s ease;
      }
      mark[data-ra="CHUA_DAT"] {
        background-color: rgba(254, 226, 226, 0.9) !important;
        color: #991b1b !important;
        text-decoration-color: #dc2626 !important;
      }
      mark[data-ra="DAT"] {
        background-color: rgba(254, 243, 199, 0.9) !important;
        color: #92400e !important;
        text-decoration-color: #d97706 !important;
      }
      mark[data-ra="TOT"] {
        background-color: rgba(220, 252, 231, 0.9) !important;
        color: #166534 !important;
        text-decoration-color: #16a34a !important;
      }
      .ra-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1c1a17;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.4;
        white-space: normal;
        max-width: 280px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        z-index: 999999;
        pointer-events: none;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      mark[data-ra]:hover .ra-tooltip {
        display: block;
      }
      #ra-floating-trigger {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;
        background: #4B37C8;
        color: #ffffff;
        padding: 8px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 14px rgba(75, 55, 200, 0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border: none;
        outline: none;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      #ra-floating-trigger:hover {
        transform: translateY(-2px);
        background: #3c2ba6;
      }
      #ra-floating-trigger .ra-logo-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: #1c1a17;
        color: #FFE27A;
        font-family: serif;
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  }

  // Iterate over items and highlight using TreeWalker
  for (const item of validItems) {
    const needle = normalizeText(item.evidence_quote);
    if (needle.length < 10) continue;

    // First try exact match, then substring &ge; 20 chars
    const searchTarget = needle.length > 80 ? needle.slice(0, 80) : needle;

    const walker = document.createTreeWalker(
      targetEl,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let node: Text | null = null;
    while ((node = walker.nextNode() as Text | null)) {
      if (!node.nodeValue) continue;

      const normNodeText = normalizeText(node.nodeValue);
      const matchIndex = normNodeText.indexOf(searchTarget);

      if (matchIndex !== -1) {
        try {
          // Find original character offsets approximately
          const origText = node.nodeValue;
          // Approximate length in original text
          const spanLen = Math.min(searchTarget.length + 10, origText.length);

          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(origText.length, spanLen));

          const mark = document.createElement("mark");
          mark.setAttribute("data-ra", item.level);
          mark.setAttribute("data-ra-id", item.id);

          const tooltip = document.createElement("span");
          tooltip.className = "ra-tooltip";
          const levelName =
            item.level === "CHUA_DAT"
              ? "⊗ Chưa đạt"
              : item.level === "DAT"
              ? "⊖ Đạt"
              : "✓ Tốt";
          tooltip.textContent = `${levelName} · ${item.reason}`;

          const extracted = range.extractContents();
          mark.appendChild(extracted);
          mark.appendChild(tooltip);

          // Click on highlight sends message to side panel
          mark.addEventListener("click", () => {
            chrome.runtime.sendMessage({
              type: "RA_SCROLL_TO_CRITERION",
              criterionId: item.id,
            });
          });

          range.insertNode(mark);
          break; // highlighted this item
        } catch (e) {
          console.warn("[RootAccess] Highlighting error:", e);
        }
      }
    }
  }

  // Set up MutationObserver to clear highlights if element re-renders
  if (activeObserver) {
    activeObserver.disconnect();
  }
  activeObserver = new MutationObserver(() => {
    // If element inner structure changes drastically, disconnect
    if (!targetEl.querySelector("mark[data-ra]")) {
      activeObserver?.disconnect();
      activeObserver = null;
    }
  });
  activeObserver.observe(targetEl, { childList: true, subtree: false });
}

// Inject floating button in bottom right corner
export function injectFloatingButton() {
  if (document.getElementById("ra-floating-trigger")) return;

  const btn = document.createElement("button");
  btn.id = "ra-floating-trigger";
  btn.innerHTML = `
    <span class="ra-logo-icon">R</span>
    <span>Mở RootAccess</span>
  `;

  btn.addEventListener("click", () => {
    // Try to open side panel or send message
    chrome.runtime.sendMessage({ type: "RA_OPEN_PANEL" });
  });

  document.body.appendChild(btn);
}
