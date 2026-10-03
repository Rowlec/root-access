"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function ConnectExtensionPage() {
  const { data: session, isPending } = authClient.useSession();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [showTechnicalError, setShowTechnicalError] = useState(false);
  const [extensionId, setExtensionId] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);

  // Initialize extension ID & connection state from URL param, localStorage, or env default
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAlreadyConnected = localStorage.getItem("ra_extension_connected") === "true";
      if (isAlreadyConnected) {
        setConnected(true);
      }

      const params = new URLSearchParams(window.location.search);
      const urlExtId = params.get("extId");
      if (urlExtId) {
        setExtensionId(urlExtId);
        localStorage.setItem("ra_extension_id", urlExtId);
      } else {
        const stored = localStorage.getItem("ra_extension_id");
        if (stored) {
          setExtensionId(stored);
        } else if (process.env.NEXT_PUBLIC_EXTENSION_ID) {
          setExtensionId(process.env.NEXT_PUBLIC_EXTENSION_ID);
        } else {
          setExtensionId("lhkeijkblmnfnlifbmmneocfonbegkhoj");
        }
      }
    }
  }, []);

  // Listen to messages from content-web.js (Extension bridge)
  useEffect(() => {
    const handleExtensionBridge = (event: MessageEvent) => {
      if (event.data?.source !== "ROOT_ACCESS_EXTENSION") return;

      if (event.data.extId) {
        setExtensionId(event.data.extId);
        if (typeof window !== "undefined") {
          localStorage.setItem("ra_extension_id", event.data.extId);
        }
      }

      if (event.data.type === "RA_EXTENSION_STATUS") {
        if (event.data.hasSession) {
          setConnected(true);
          setConnecting(false);
          setErrorNotice(null);
          if (typeof window !== "undefined") {
            localStorage.setItem("ra_extension_connected", "true");
          }
        } else if (session?.session?.token) {
          // Extension is detected but lacks session; sync token now
          window.postMessage(
            {
              source: "ROOT_ACCESS_WEB",
              type: "SET_SESSION",
              token: session.session.token,
              user: session.user,
            },
            "*",
          );
        }
      }

      if (event.data.type === "RA_SESSION_SAVED") {
        setConnected(true);
        setConnecting(false);
        setErrorNotice(null);
        if (typeof window !== "undefined") {
          localStorage.setItem("ra_extension_connected", "true");
        }
      }
    };

    window.addEventListener("message", handleExtensionBridge);
    // Ping extension bridge
    window.postMessage({ source: "ROOT_ACCESS_WEB", type: "CHECK_EXTENSION" }, "*");

    return () => window.removeEventListener("message", handleExtensionBridge);
  }, [session]);

  const tryConnect = async (token: string, user: any, targetExtId?: string) => {
    const idToUse = (targetExtId ?? extensionId).trim();
    setConnecting(true);
    setErrorNotice(null);
    setRawError(null);

    // Also send through postMessage bridge
    if (typeof window !== "undefined") {
      window.postMessage(
        {
          source: "ROOT_ACCESS_WEB",
          type: "SET_SESSION",
          token,
          user,
        },
        "*",
      );
    }

    if (!idToUse) {
      setConnecting(false);
      setErrorNotice(
        "Chưa có Extension ID. Vui lòng cài đặt Extension trước hoặc sao chép Token thủ công bên dưới.",
      );
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("ra_extension_id", idToUse);
    }

    if (
      typeof window !== "undefined" &&
      (window as any).chrome?.runtime?.sendMessage
    ) {
      const chromeRuntime = (window as any).chrome.runtime;

      try {
        chromeRuntime.sendMessage(
          idToUse,
          {
            type: "RA_SESSION",
            token,
            user,
          },
          (response: any) => {
            const lastError = (window as any).chrome?.runtime?.lastError;
            if (lastError || !response?.ok) {
              const errorMsg = lastError?.message || "Extension chưa phản hồi";
              console.warn(
                "Could not connect to extension with ID:",
                idToUse,
                lastError,
              );
              setRawError(errorMsg);
              setErrorNotice(
                "Trình duyệt chưa phát hiện thấy Extension qua ID này.",
              );
              // Do not force setConnected(false) if user already has it open
            } else {
              setConnected(true);
              setErrorNotice(null);
              setRawError(null);
              if (typeof window !== "undefined") {
                localStorage.setItem("ra_extension_connected", "true");
              }
            }
            setConnecting(false);
          },
        );
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        setRawError(errorMsg);
        setErrorNotice(
          "Trình duyệt chưa phát hiện thấy Extension qua ID này.",
        );
        setConnecting(false);
      }
    } else {
      setErrorNotice(
        "Trình duyệt hiện tại chưa cài đặt hoặc không hỗ trợ Chrome Extension API.",
      );
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (session?.session?.token && extensionId && !connected) {
      tryConnect(session.session.token, session.user, extensionId);
    }
  }, [session, extensionId]);

  const handleCopyToken = () => {
    if (session?.session?.token) {
      navigator.clipboard.writeText(session.session.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  if (isPending) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 space-y-6">
      {/* Stepper Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kết nối Chrome Extension
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Đồng bộ tài khoản Root Access để Extension tự động nhận lượt chấm miễn phí của bạn.
          </p>
        </div>

        {/* Stepper Tracker */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Link
            href="/install-extension"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">
              1
            </span>
            Cài đặt Extension
          </Link>
          <span className="text-border">/</span>
          <span className="flex items-center gap-1.5 font-bold text-primary">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              2
            </span>
            Kết nối tài khoản (Hiện tại)
          </span>
        </div>
      </div>

      {!session ? (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 text-center shadow-lg">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Đăng nhập tài khoản Root Access
            </h2>
            <p className="text-xs text-muted-foreground">
              Đăng nhập bằng tài khoản Google hoặc Email của bạn để đồng bộ với Extension.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              className="w-full h-11 text-xs font-semibold gap-2"
              onClick={() =>
                authClient.signIn.social({
                  callbackURL: "/connect-extension",
                  provider: "google",
                })
              }
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Đăng nhập với Google
            </Button>

            <div className="relative flex items-center justify-center my-3">
              <span className="bg-card px-2 text-[11px] text-muted-foreground">
                hoặc
              </span>
            </div>

            <Link
              href="/sign-in?redirect_url=/connect-extension"
              className="block w-full text-center rounded-xl border border-border py-2.5 text-xs font-medium text-foreground hover:bg-muted/30"
            >
              Đăng nhập bằng Email & Mật khẩu
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Đang đăng nhập với:</p>
              <p className="text-sm font-bold text-foreground">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("ra_extension_connected");
                }
                authClient.signOut();
              }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              Đăng xuất
            </button>
          </div>

          {/* Connected State */}
          {connected ? (
            <div className="rounded-2xl border border-emerald-300 bg-[var(--ok-bg)]/60 p-6 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-[var(--ok)] border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-[var(--ok)]">
                  Đã kết nối thành công với Extension! ✓
                </h3>
                <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
                  Tài khoản <strong>{session.user.email}</strong> đã được đồng bộ sang Extension. 
                  Tiện ích Root Access bên cạnh ChatGPT & Gemini đã sẵn sàng hỗ trợ bạn làm đề án!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md transition-colors"
                >
                  Mở ChatGPT <ExternalLink size={13} />
                </a>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md transition-colors"
                >
                  Mở Gemini <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  onClick={() =>
                    tryConnect(session.session.token, session.user, extensionId)
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw size={13} />
                  Đồng bộ lại
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {connecting ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center rounded-2xl border border-border bg-card/50">
                  <Loader2 className="animate-spin text-primary size-8" />
                  <p className="text-xs font-semibold text-foreground">
                    Đang tự động kết nối sang Extension...
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Đang truyền thông tin phiên làm việc, vui lòng chờ 1-2 giây.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* REASSURING GREEN CONFIRMATION CARD: When user already sees sidepanel is open */}
                  <div className="rounded-2xl border-2 border-emerald-300 bg-[var(--ok-bg)]/70 p-5 space-y-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-emerald-100 text-[var(--ok)] border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-[var(--ok)] text-sm">
                          Tiện ích bên phải đã hiển thị sẵn sàng?
                        </p>
                        <p className="text-[var(--ink-2)] leading-relaxed">
                          Nếu khung tiện ích bên phải đã mở và hiển thị dòng chữ <em>&ldquo;Mở ChatGPT hoặc Gemini&rdquo;</em> (hoặc các phần đề án), tức là tài khoản của bạn <strong>đã được kết nối thành công!</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setConnected(true);
                        setErrorNotice(null);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("ra_extension_connected", "true");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      <span>Tiện ích bên phải đã mở rồi ➔ Xác nhận & Bắt đầu làm bài</span>
                    </button>
                  </div>

                  {/* Amber Notice Card */}
                  <div className="rounded-2xl border border-amber-300 bg-[var(--mid-bg)] p-4 space-y-3">
                    <div className="flex items-start gap-2.5 text-[var(--mid)]">
                      <Compass size={18} className="shrink-0 mt-0.5" />
                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-[var(--ink)]">
                          Chưa tự động gửi được tới Extension
                        </p>
                        <p className="text-[var(--ink-2)] leading-relaxed">
                          {errorNotice || "Trình duyệt chưa phát hiện thấy Extension đang hoạt động trên máy bạn."}
                        </p>
                        <p className="text-[11px] text-[var(--mid)] leading-relaxed bg-amber-100/70 p-2.5 rounded-lg border border-amber-300">
                          💡 <strong>Mẹo:</strong> Hiện tượng này xảy ra khi bạn mở trang web trước rồi mới bật tiện ích bên phải sau. Nếu tiện ích bên phải đã mở rồi, bạn chỉ cần bấm nút màu xanh <strong>&ldquo;Tiện ích bên phải đã mở rồi ➔ Xác nhận&rdquo;</strong> ở trên để tiếp tục!
                        </p>
                      </div>
                    </div>

                    {rawError ? (
                      <div className="text-[11px] text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => setShowTechnicalError(!showTechnicalError)}
                          className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1"
                        >
                          <span>{showTechnicalError ? "Ẩn chi tiết kỹ thuật" : "Chi tiết lỗi kỹ thuật"}</span>
                          {showTechnicalError ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                        {showTechnicalError ? (
                          <pre className="mt-1.5 p-2 rounded-lg bg-black/40 border border-border text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
                            {rawError}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}

                    <button
                      onClick={() =>
                        tryConnect(session.session.token, session.user, extensionId)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow"
                    >
                      <RefreshCw size={13} />
                      <span>Thử gửi lại tín hiệu kết nối</span>
                    </button>
                  </div>

                  {/* Guide link for users who haven't installed yet */}
                  <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2">
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
                      <p>
                        Nếu bạn chưa tải hoặc chưa cài tiện ích vào Chrome, hãy tải file zip và cài đặt trước.
                      </p>
                    </div>
                    <Link
                      href="/install-extension"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Download size={13} />
                      <span>Xem hướng dẫn tải & cài đặt Extension (1 phút) ➔</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Option 2: Manual Token (Reliable 100%) */}
          <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowManualSection(!showManualSection)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <KeyRound size={14} className="text-primary" />
                {connected
                  ? "Tùy chọn phụ: Xem Token kết nối hoặc nhập thủ công"
                  : "Cách 2: Nhập Token kết nối thủ công (100% thành công)"}
              </span>
              {showManualSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showManualSection && (
              <div className="pt-2 space-y-3 border-t border-border/50 mt-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bấm nút <strong>&ldquo;Sao chép Token&rdquo;</strong>, sau đó mở khung Extension bên phải, bấm vào dòng <strong>&ldquo;🔑 Hoặc dán Token kết nối thủ công&rdquo;</strong>, dán vào và bấm <strong>&ldquo;Hoàn tất kết nối&rdquo;</strong>:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={session.session.token}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono select-all focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow transition-colors"
                  >
                    {copiedToken ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Sao chép Token</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-muted-foreground">
                    Cấu hình Extension ID (Nếu bạn nạp unpacked có ID riêng):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nhập 32 ký tự ID từ chrome://extensions/..."
                      value={extensionId}
                      onChange={(e) => setExtensionId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        tryConnect(session.session.token, session.user, extensionId)
                      }
                      className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <RefreshCw size={13} />
                      <span>Kết nối</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helpful Link to Installation Guide */}
      <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <p className="font-bold text-foreground flex items-center gap-2">
            <Puzzle size={15} className="text-primary" />
            <span>Chưa cài đặt Extension hoặc cần xem lại hướng dẫn?</span>
          </p>
          <p className="text-muted-foreground text-[11px]">
            Tải file zip, giải nén và nạp vào Chrome chỉ mất 1 phút với 4 bước minh họa chi tiết.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 text-xs gap-1.5">
          <Link href="/install-extension">
            <span>Mở trang hướng dẫn cài đặt</span>
            <ArrowRight size={13} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
