import { AdapterError } from "./types";

export function findFirst(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    } catch {
      // Ignore invalid selector syntax
    }
  }
  return null;
}

export function findAll(selectors: string[]): HTMLElement[] {
  for (const selector of selectors) {
    try {
      const list = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (list.length > 0) return list;
    } catch {
      // Ignore invalid selector syntax
    }
  }
  return [];
}

export async function insertTextIntoContentEditable(
  el: HTMLElement,
  text: string,
  replace: boolean = false,
): Promise<{ ok: true } | { ok: false; error: AdapterError }> {
  try {
    el.focus();

    // Check if element already has substantial text and replace wasn't explicitly confirmed
    const currentText = el.innerText?.trim() ?? "";
    if (currentText.length > 0 && !replace) {
      const shouldReplace = window.confirm(
        "Ô chat đang có sẵn nội dung. Bạn có muốn thay thế bằng prompt của RootAccess không?",
      );
      if (!shouldReplace) {
        return { ok: false, error: "INSERT_FAILED" };
      }
    }

    // Select all existing content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Try execCommand first (works reliably on contenteditable in Chromium)
    let inserted = document.execCommand("insertText", false, text);

    if (!inserted || !el.innerText?.includes(text.slice(0, 20))) {
      // Fallback: Dispatch InputEvent
      el.focus();
      const inputEvent = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text,
      });
      el.dispatchEvent(inputEvent);

      el.innerText = text;

      const changeEvent = new Event("input", { bubbles: true });
      el.dispatchEvent(changeEvent);
    }

    // Verify insertion
    const firstSnippet = text.slice(0, 15).trim();
    if (el.innerText && el.innerText.includes(firstSnippet)) {
      return { ok: true };
    }

    return { ok: false, error: "INSERT_FAILED" };
  } catch (err) {
    console.error("[RootAccess] Insert prompt failed:", err);
    return { ok: false, error: "INSERT_FAILED" };
  }
}
