import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("Hero");
  const workflowSteps = [
    t("steps.problemDiscovery"),
    t("steps.targetCustomer"),
    t("steps.valueProposition"),
    t("steps.proposalDraft"),
  ];

  return (
    <section className="w-full">
      <div className="mx-auto grid min-h-[78svh] w-full max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles aria-hidden="true" className="size-4" />
            {t("guidedSteps")}
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.08] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="btn-liquid h-12 rounded-full px-6 text-base font-semibold text-primary-foreground"
            >
              <a href="#goal-form">
                {t("action")}
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="btn-glass h-12 rounded-full px-6 text-base font-semibold"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="glass w-full rounded-3xl p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-muted-foreground">
                {t("workflowName")}
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-foreground">
              <RefreshCw aria-hidden="true" className="size-4 text-accent" />
              {t("guidedSteps")}
            </div>
          </div>

          <div className="grid gap-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="flex min-h-20 items-center gap-4 rounded-2xl border border-border/60 bg-secondary/30 px-4 transition-colors hover:bg-secondary/45"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/20 font-display text-base font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-lg font-semibold text-foreground">
                    {step}
                  </p>
                </div>
                {index < workflowSteps.length - 1 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto size-5 text-muted-foreground/70"
                  />
                ) : (
                  <RefreshCw
                    aria-hidden="true"
                    className="ml-auto size-5 text-primary"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
