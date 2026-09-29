import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  KeyRound,
  Loader2,
  LogIn,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, api } from "../../lib/api";
import { setStoredToken } from "../../lib/auth";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [showManual, setShowManual] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const extId =
    typeof chrome !== "undefined" && chrome?.runtime?.id
      ? chrome.runtime.id
      : "";

  const handleLogin = () => {
    const connectUrl = `${API_BASE_URL}/connect-extension${extId ? `?extId=${extId}` : ""}`;
    if (typeof chrome !== "undefined" && chrome?.tabs?.create) {
      chrome.tabs.create({ url: connectUrl });
    } else {
      window.open(connectUrl, "_blank");
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setErrorMsg("Vui lòng nhập Session Token.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await setStoredToken(cleanToken);
      if (onLoginSuccess) {
        await onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (extId) {
      navigator.clipboard.writeText(extId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-between p-5 text-center overflow-y-auto">
      <div className="my-auto space-y-5 max-w-sm w-full py-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
          <Sparkles className="size-7 text-white" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-white">
            RootAccess
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Viết từng phần Startup Proposal ngay trong ChatGPT hoặc Gemini, và biết luôn phần nào đạt, phần nào sẽ bị trừ điểm theo tiêu chí môn EXE.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-left text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <span>✨</span> 5 lượt chấm miễn phí khi đăng ký
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>🛡️</span> Không bao giờ đọc lịch sử chat ngoài ý muốn
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>📊</span> Chấm sát tiêu chí rubric của EXE101
          </div>
        </div>

        {/* Primary Login Button */}
        <div className="space-y-2">
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
          >
            <LogIn size={16} /> Đăng nhập qua Web
          </button>
          <p className="text-[11px] text-slate-400">
            Mở trang web để đăng nhập Google hoặc Email.
          </p>
        </div>

        {/* Manual Token Option (Foolproof fallback) */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <KeyRound size={13} className="text-blue-400" />
              Nhấn vào để kết nối
            </span>
            {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showManual && (
            <form onSubmit={handleManualConnect} className="mt-3 space-y-2.5">
              <p className="text-[11px] text-slate-400 leading-normal">
                Bấm nút <strong>&ldquo;Sao chép Token&rdquo;</strong> trên trang web và dán vào đây:
              </p>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Dán token vào đây..."
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-none"
              />

              {errorMsg && (
                <p className="text-[11px] text-red-400 leading-tight">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  "Hoàn tất kết nối"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Extension ID Information */}
        {extId && (
          <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-[11px] text-slate-400">
            <span className="truncate pr-2">ID: <code className="text-slate-300 font-mono">{extId}</code></span>
            <button
              onClick={handleCopyId}
              title="Sao chép Extension ID"
              className="shrink-0 flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              {copiedId ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-[10px]">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span className="text-[10px]">Sao chép ID</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 pb-2">
        RootAccess v0.1.0 • Chuẩn tiêu chí EXE101
      </div>
    </div>
  );
}
