import { findAll, findFirst, insertTextIntoContentEditable } from "./base";
import { AdapterError, SelectorConfig, SiteAdapter, SiteId } from "./types";

export class GeminiAdapter implements SiteAdapter {
  id: SiteId = "gemini";
  private selectors: SelectorConfig["gemini"];

  constructor(selectors?: SelectorConfig["gemini"]) {
    this.selectors = selectors ?? {
      input: ["rich-textarea .ql-editor", "div[contenteditable='true']"],
      assistantMessage: [
        "model-response message-content",
        "model-response",
      ],
      stopButton: [
        "button[aria-label*='Stop']",
        "button[aria-label*='Dừng']",
      ],
    };
  }

  updateSelectors(selectors: SelectorConfig["gemini"]) {
    this.selectors = selectors;
  }

  matches(url: URL): boolean {
    return url.hostname.includes("gemini.google.com");
  }

  isReady(): boolean {
    return findFirst(this.selectors.input) !== null;
  }

  async insertPrompt(
    text: string,
  ): Promise<{ ok: true } | { ok: false; error: AdapterError }> {
    const el = findFirst(this.selectors.input);
    if (!el) {
      return { ok: false, error: "INPUT_NOT_FOUND" };
    }

    return await insertTextIntoContentEditable(el, text);
  }

  isGenerating(): boolean {
    return findFirst(this.selectors.stopButton) !== null;
  }

  async getLastAssistantMessage(): Promise<
    { ok: true; text: string } | { ok: false; error: AdapterError }
  > {
    if (this.isGenerating()) {
      return { ok: false, error: "STILL_GENERATING" };
    }

    const messages = findAll(this.selectors.assistantMessage);
    if (messages.length === 0) {
      return { ok: false, error: "NO_ASSISTANT_MESSAGE" };
    }

    const last = messages[messages.length - 1];
    let text = (last.innerText ?? "").trim();

    if (!text) {
      return { ok: false, error: "NO_ASSISTANT_MESSAGE" };
    }

    if (text.length > 20000) {
      text = text.slice(0, 20000);
    }

    return { ok: true, text };
  }
}
