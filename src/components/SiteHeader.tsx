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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/45 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/app" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Root Access logo"
            width={40}
            height={22}
            className="h-6 w-auto shrink-0 drop-shadow-[0_0_12px_oklch(0.62_0.2_300/0.6)]"
            priority
          />
          <span className="hidden font-display text-base font-semibold tracking-tight text-foreground sm:inline">
            Root Access
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
            href="/connect-extension"
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
