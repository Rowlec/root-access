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
  isClerkConfigured: boolean;
};

export function SiteHeader({ locale, isClerkConfigured }: SiteHeaderProps) {
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
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
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

        <nav className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-block"
          >
            Dashboard
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-muted-foreground hover:text-foreground"
            aria-label={tourLabel}
            title={tourLabel}
            onClick={() => window.dispatchEvent(new Event(onboardingResetEvent))}
          >
            <CircleHelp aria-hidden="true" />
          </Button>
          <Link
            href="/checkout"
            className="flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 px-3 text-sm font-semibold text-foreground"
            title="1 review = 1 credit / 1 improve = 1 credit"
          >
            <Coins aria-hidden="true" className="size-4 text-primary" />
            <span>{creditLabel}</span>
          </Link>
          <LocaleSwitcher className="h-9 rounded-full bg-secondary/35 shadow-none" />
          <AuthControls
            locale={locale}
            isClerkConfigured={isClerkConfigured}
          />
        </nav>
      </div>
    </header>
  );
}
