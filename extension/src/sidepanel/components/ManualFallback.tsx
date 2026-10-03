import React, { useState } from "react";
import { Copy, Check, ExternalLink, Send } from "lucide-react";

export function ManualFallbackPrompt({ promptText }: { promptText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-300">
          Không tự điền được vào ô chat
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied ? "Đã chép" : "Sao chép prompt"}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">
        Bạn có thể sao chép prompt và dán thủ công vào ChatGPT hoặc Gemini.
      </p>
    </div>
  );
}

export function ManualFallbackAnswerInput({
  onSubmitAnswer,
  loading = false,
}: {
  onSubmitAnswer: (text: string) => void;
  loading?: boolean;
}) {
  const [answerText, setAnswerText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim().length >= 150) {
      onSubmitAnswer(answerText.trim());
    }
  };

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-2.5">
      <label className="block text-xs font-semibold text-blue-300">
        Dán câu trả lời của AI vào đây để chấm:
      </label>
      <textarea
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        rows={4}
        placeholder="Dán toàn bộ câu trả lời AI tạo ra (tối thiểu 150 ký tự)..."
        className="w-full rounded-lg border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {answerText.length}/150 ký tự tối thiểu
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || answerText.trim().length < 150}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          <Send size={13} />
          {loading ? "Đang chấm..." : "Chấm bài này"}
        </button>
      </div>
    </div>
  );
}

export function UnsupportedSiteNotice({
  userEmail,
  credits,
  projectName,
  packName,
  nextSectionTitle,
}: {
  userEmail?: string | null;
  credits?: number | null;
  projectName?: string | null;
  packName?: string | null;
  nextSectionTitle?: string | null;
}) {
  const openUrl = (url: string) => {
    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-between p-4 space-y-4">
      {/* Top Project & Account Banner */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--ok)] flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--ok)] animate-pulse" />
            Tài khoản đã kết nối
          </span>
          {typeof credits === "number" && (
            <span className="font-bold text-[var(--accent)] font-mono">
              {credits} credits
            </span>
          )}
        </div>
        {userEmail && (
          <p className="text-[11px] text-[var(--muted)] truncate">{userEmail}</p>
        )}
      </div>

      {/* Project Status Info (Spec B12: Hiện tiến độ + Phần tiếp theo) */}
      {projectName && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-2.5 text-xs text-left shadow-sm">
          <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--muted)]">
            Dự án hiện tại
          </span>
          <h4 className="font-serif font-bold text-sm text-[var(--ink)] truncate">
            {projectName}
          </h4>
          {packName && (
            <div className="text-[11px] text-[var(--muted)]">{packName}</div>
          )}
          {nextSectionTitle && (
            <div className="mt-2 rounded-lg bg-[var(--accent-weak)] p-2.5 border border-purple-200">
              <span className="font-semibold text-[var(--accent)] block text-[11px]">
                Phần tiếp theo cần viết:
              </span>
              <span className="font-bold text-[var(--ink)] text-xs">
                {nextSectionTitle}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Guidance */}
      <div className="space-y-2 text-center py-2">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--sunken)] text-[var(--accent)] mx-auto">
          <ExternalLink size={20} />
        </div>
        <h3 className="text-sm font-serif font-bold text-[var(--ink)]">
          Mở ChatGPT để bắt đầu
        </h3>
        <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
          RootAccess chạy ngay bên cạnh trang chat của ChatGPT hoặc Gemini để tự động chèn prompt và gạch chân lỗi câu từ.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => openUrl("https://chatgpt.com")}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-white py-3 text-xs font-bold hover:opacity-90 shadow-sm transition-opacity"
        >
          Mở ChatGPT (chatgpt.com)
        </button>
        <button
          onClick={() => openUrl("https://gemini.google.com")}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] py-2.5 text-xs font-semibold hover:bg-[var(--sunken)] transition-colors"
        >
          Mở Gemini (gemini.google.com)
        </button>
      </div>
    </div>
  );
}
