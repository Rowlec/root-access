"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Coins } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthControls } from "@/components/AuthControls";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import {
  creditPlanStorageKey,
  parseCreditPlan,
  type CreditPlan,
} from "@/lib/credit-policy";
import { onboardingResetEvent } from "@/lib/onboarding";

function readCreditPlan(): CreditPlan {
  if (typeof window === "undefined") {
    return "free";
  }

  try {
    return parseCreditPlan(window.localStorage.getItem(creditPlanStorageKey));
  } catch {
    return "free";
  }
}

type SiteHeaderProps = {
  locale: string;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const [plan, setPlan] = useState<CreditPlan>("free");
  const { getRemaining } = useCreditUsage(plan);
  const tourLabel =
    locale === "vi" ? "Xem hướng dẫn sử dụng" : "Open product tour";
  const creditLabel =
    plan === "free"
      ? `${getRemaining("review")}/${getRemaining("improvement")}`
      : getRemaining("review");

  useEffect(() => {
    function handleStorage() {
      setPlan(readCreditPlan());
    }

    const initialSyncId = window.setTimeout(handleStorage, 0);

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleStorage);

    return () => {
      window.clearTimeout(initialSyncId);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/app" className="flex shrink-0 items-center gap-2.5">
          <div className="relative flex size-7 items-center justify-center rounded bg-[#1C1A17] text-white font-serif font-bold text-base shadow-sm">
            R
            <span className="absolute -bottom-0.5 left-1 right-1 h-1 bg-[#FFE27A] rounded-full" />
          </div>
          <span className="font-serif font-bold text-lg text-foreground tracking-tight">
            RootAccess
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/pricing"
            className="text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Bảng giá
          </Link>
          <Link
            href="/privacy"
            className="hidden sm:inline-block text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Bảo mật
          </Link>
          <Link
            href="/account"
            className="text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tài khoản
          </Link>
          <Link
            href="/install-extension"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/30"
          >
            Cài Extension
          </Link>
          <AuthControls locale={locale} />
        </nav>
      </div>
    </header>
  );
}
