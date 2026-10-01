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
}: {
  userEmail?: string | null;
  credits?: number | null;
}) {
  const openUrl = (url: string) => {
    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex h-[75vh] flex-col items-center justify-center p-5 text-center space-y-4">
      {/* Connected Account Badge */}
      <div className="w-full max-w-xs rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-left space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Đã kết nối tài khoản ✓
          </span>
          {typeof credits === "number" && (
            <span className="font-bold text-xs text-emerald-400 font-mono">
              {credits} lượt chấm
            </span>
          )}
        </div>
        {userEmail ? (
          <p className="text-[11px] text-slate-300 font-medium truncate">
            {userEmail}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
        <ExternalLink size={28} className="text-blue-400" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-white">Mở ChatGPT hoặc Gemini</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          RootAccess hoạt động trực tiếp bên cạnh trang chat của ChatGPT hoặc Gemini. Vui lòng mở một trong hai trang để bắt đầu viết và chấm đề án.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
        <button
          onClick={() => openUrl("https://chatgpt.com")}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/25 border border-emerald-500/50 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/40 transition-colors"
        >
          Mở ChatGPT (chatgpt.com)
        </button>
        <button
          onClick={() => openUrl("https://gemini.google.com")}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/25 border border-blue-500/50 px-4 py-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/40 transition-colors"
        >
          Mở Gemini (gemini.google.com)
        </button>
      </div>
    </div>
  );
}
