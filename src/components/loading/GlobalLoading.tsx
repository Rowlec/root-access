"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

type GlobalLoadingContextType = {
  isLoading: boolean;
  message: string | null;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  isLoading: false,
  message: null,
  startLoading: () => {},
  stopLoading: () => {},
});

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext);
}

export function startGlobalLoading(message?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("root-access:loading-start", { detail: { message } }),
    );
  }
}

export function stopGlobalLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("root-access:loading-stop"));
  }
}

function NavigationWatcher({ onNavigateEnd }: { onNavigateEnd: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onNavigateEnd();
  }, [pathname, searchParams, onNavigateEnd]);

  return null;
}

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg || null);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setMessage(null);
  }, []);

  // Listen to custom global events
  useEffect(() => {
    const handleStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      startLoading(customEvent.detail?.message);
    };
    const handleStop = () => {
      stopLoading();
    };

    window.addEventListener("root-access:loading-start", handleStart);
    window.addEventListener("root-access:loading-stop", handleStop);
    return () => {
      window.removeEventListener("root-access:loading-start", handleStart);
      window.removeEventListener("root-access:loading-stop", handleStop);
    };
  }, [startLoading, stopLoading]);

  // Intercept internal link clicks to immediately trigger global loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore hash links, javascript:, tel:, mailto:
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // Ignore new tab, download, or modifier keys
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if internal navigation
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          const currentUrl = new URL(window.location.href);
          // If navigating to different page or different query
          if (
            url.pathname !== currentUrl.pathname ||
            url.search !== currentUrl.search
          ) {
            startLoading();
          }
        }
      } catch {
        if (href.startsWith("/") && href !== window.location.pathname) {
          startLoading();
        }
      }
    };

    const handlePopState = () => {
      startLoading();
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startLoading]);

  // Safety auto-dismiss timeout (max 10s so user is never stuck)
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <GlobalLoadingContext.Provider
      value={{ isLoading, message, startLoading, stopLoading }}
    >
      <Suspense fallback={null}>
        <NavigationWatcher onNavigateEnd={stopLoading} />
      </Suspense>
      {children}
      {isLoading ? <GlobalLoadingOverlay message={message} /> : null}
    </GlobalLoadingContext.Provider>
  );
}

export function GlobalLoadingOverlay({ message }: { message?: string | null }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-all duration-300 animate-in fade-in"
    >
      {/* Top neon loading bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-fuchsia-400 to-primary animate-pulse z-[1000000]" />

      {/* Center glowing card */}
      <div className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border border-primary/40 bg-card/85 p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] backdrop-blur-xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
        {/* Glow halo */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-fuchsia-500/20 to-purple-600/30 blur-xl opacity-80 -z-10 animate-pulse" />

        {/* Multi-ring Spinner */}
        <div className="relative flex items-center justify-center size-18">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-fuchsia-400 animate-spin shadow-[0_0_15px_rgba(168,85,247,0.4)]" />

          {/* Inner ring spinning opposite */}
          <div
            className="absolute size-11 rounded-full border-3 border-transparent border-b-purple-400 border-l-primary/70 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
          />

          {/* Center glowing dot */}
          <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)] animate-ping" />
          <Sparkles className="size-5 text-primary absolute animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground tracking-wide">
            {message || "Đang tải dữ liệu..."}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Root Access đang xử lý, vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    </div>
  );
}
