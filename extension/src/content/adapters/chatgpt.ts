import { findAll, findFirst, insertTextIntoContentEditable } from "./base";
import { AdapterError, SelectorConfig, SiteAdapter, SiteId } from "./types";

export class ChatGPTAdapter implements SiteAdapter {
  id: SiteId = "chatgpt";
  private selectors: SelectorConfig["chatgpt"];

  constructor(selectors?: SelectorConfig["chatgpt"]) {
    this.selectors = selectors ?? {
      input: ["#prompt-textarea", "div[contenteditable='true']"],
      assistantMessage: ["[data-message-author-role='assistant']"],
      stopButton: ["button[data-testid='stop-button']"],
    };
  }

  updateSelectors(selectors: SelectorConfig["chatgpt"]) {
    this.selectors = selectors;
  }

  matches(url: URL): boolean {
    return url.hostname.includes("chatgpt.com");
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
