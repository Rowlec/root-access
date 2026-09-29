export type SiteId = "chatgpt" | "gemini";

export interface PingResponse {
  site: SiteId | null;
  ready: boolean;
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (!chrome?.tabs?.query) return null;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

export async function sendToActiveTab<T>(message: any): Promise<T> {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error("Không tìm thấy tab đang mở");
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id!, message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message || "Không thể kết nối với trang"));
        return;
      }
      resolve(response);
    });
  });
}

export async function pingTab(): Promise<PingResponse> {
  try {
    return await sendToActiveTab<PingResponse>({ type: "PING" });
  } catch {
    return { site: null, ready: false };
  }
}

export async function checkIsGenerating(): Promise<boolean> {
  try {
    const res = await sendToActiveTab<{ generating: boolean }>({
      type: "IS_GENERATING",
    });
    return Boolean(res?.generating);
  } catch {
    return false;
  }
}

export async function insertPromptToTab(
  text: string,
  replace: boolean = false,
): Promise<{ ok: boolean; error?: string }> {
  return await sendToActiveTab<{ ok: boolean; error?: string }>({
    type: "INSERT_PROMPT",
    text,
    replace,
  });
}

export async function readLastAnswerFromTab(): Promise<{
  ok: boolean;
  text?: string;
  error?: string;
}> {
  return await sendToActiveTab<{
    ok: boolean;
    text?: string;
    error?: string;
  }>({
    type: "READ_LAST_ANSWER",
  });
}
