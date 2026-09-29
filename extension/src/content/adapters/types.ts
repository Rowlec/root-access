export type SiteId = "chatgpt" | "gemini";

export type AdapterError =
  | "INPUT_NOT_FOUND"
  | "NO_ASSISTANT_MESSAGE"
  | "STILL_GENERATING"
  | "INSERT_FAILED";

export interface SiteAdapter {
  id: SiteId;
  matches(url: URL): boolean;
  /** Tìm thấy ô nhập chat chưa? */
  isReady(): boolean;
  /** Điền text vào ô chat. TUYỆT ĐỐI KHÔNG bấm gửi. */
  insertPrompt(text: string): Promise<{ ok: true } | { ok: false; error: AdapterError }>;
  /** Lấy nội dung (innerText) của câu trả lời AI cuối cùng trên trang. */
  getLastAssistantMessage(): Promise<
    { ok: true; text: string } | { ok: false; error: AdapterError }
  >;
  /** AI còn đang trả lời (stream) không? Nếu có thì panel khoá nút "Chấm". */
  isGenerating(): boolean;
}

export interface SelectorConfig {
  version: number;
  chatgpt: {
    input: string[];
    assistantMessage: string[];
    stopButton: string[];
  };
  gemini: {
    input: string[];
    assistantMessage: string[];
    stopButton: string[];
  };
}
